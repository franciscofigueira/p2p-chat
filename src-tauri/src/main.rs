// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
  plugin::{Builder, TauriPlugin},
  AppHandle, Manager, Runtime, State,
};
use either::Either;
use futures::{channel::mpsc::{self, Sender},  prelude::*, select};
use std::{ str::FromStr};
use std::time::Duration;
use std::error::Error;
use libp2p::{
  core::{muxing::StreamMuxerBox, transport, transport::upgrade::Version},
  gossipsub, identify, identity,
  multiaddr::Protocol,
  mdns,
  noise, ping,
  pnet::{PnetConfig, PreSharedKey},
  swarm::{NetworkBehaviour, SwarmBuilder, SwarmEvent, Swarm},
  Multiaddr, PeerId, Transport, yamux, tcp
};
use tokio::sync::{Mutex, MutexGuard};

struct SystemState{
  msg_sender: Mutex<Sender<String>>,
  identify_sender: Mutex<Sender<String>>,
}

struct MultiAddr{
  address: Mutex<String>,
}

fn main() {
  let(msg_sender_channel, mut msg_receiver_channel) = mpsc::channel::<String>(1);
  let (identify_sender_channel,mut identify_receiver_channel) = mpsc::channel::<String>(1);
  let topic = gossipsub::IdentTopic::new("chat");
  let mut swarm = setup_swarm();


  tauri::Builder::default()
    .manage( SystemState{
      msg_sender: Mutex::new(msg_sender_channel),
      identify_sender: Mutex::new(identify_sender_channel),
    }
    )
    .setup(|app|{
      let app_handle = app.app_handle();

      tauri::async_runtime::spawn(async move {
        loop{
          select!{
            identify = identify_receiver_channel.next() => match identify{
              Some(peer_id) => {
                let addr: Multiaddr = parse_legacy_multiaddr(&peer_id).unwrap();
                swarm.dial(addr).unwrap();
              },
              None => {}
            },
            msg = msg_receiver_channel.next() => match msg {
                Some(msg) => {
                  if let Err(e) = swarm
                  .behaviour_mut().gossipsub
                  .publish(topic.clone(), msg.as_bytes()) {
                      println!("Publish error: {e:?}");
                    }
                },
                None => {}
            },
            event = swarm.select_next_some() => match event { 
              SwarmEvent::Behaviour(MyBehaviourEvent::Identify(event)) => {
                println!("identify: {event:?}");
                match event  {
                  identify::Event::Received{ peer_id, info: _inf} => {
                    println!("received identify");
                   
                    app_handle.emit_all("identify", peer_id.to_string()).unwrap();
                  } ,
                _ => {}
                }
              },
              SwarmEvent::Behaviour(MyBehaviourEvent::Gossipsub(gossipsub::Event::Message {
                propagation_source: peer_id,
                  message_id: id,
                  message,
              })) => {println!(
                "Got message: '{}' with id: {id} from peer: {peer_id}",
                      String::from_utf8_lossy(&message.data),
                  );
              app_handle.emit_all("messageReceived", (peer_id.to_string(),String::from_utf8_lossy(&message.data))).unwrap();
            },
            SwarmEvent::NewListenAddr { address, .. } => {
                      let id = swarm.local_peer_id();
                      
                      app_handle.manage(MultiAddr{address: Mutex::new(format!("{address}/p2p/{id}"))});
                      println!("Local node is listening on {address}/p2p/{id}");
            },
            SwarmEvent::Behaviour(MyBehaviourEvent::Ping(event)) => {
                      match event {
                        ping::Event {
                          peer,
                                result: Result::Ok(rtt),
                                ..
                        } => {
                          println!(
                            "ping: rtt to {} is {} ms",
                                    peer.to_base58(),
                                    rtt.as_millis()
                                );
                        }
                            ping::Event {
                          peer,
                                result: Result::Err(ping::Failure::Timeout),
                                ..
                        } => {
                          println!("ping: timeout to {}", peer.to_base58());
                        }
                            ping::Event {
                          peer,
                                result: Result::Err(ping::Failure::Unsupported),
                                ..
                        } => {
                          println!("ping: {} does not support ping protocol", peer.to_base58());
                        }
                            ping::Event {
                          peer,
                                result: Result::Err(ping::Failure::Other { error }),
                                ..
                        } => {
                          println!("ping: ping::Failure with {}: {error}", peer.to_base58());
                        }
                      }
                    },

              _ => {}
            }
          }
        }
       });
       Ok(())
    }

    )
    .invoke_handler(tauri::generate_handler![greet,dial,send_message,get_peer_id])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

#[tauri::command]
fn greet(name: &str) -> String {
   format!("Hello, {}!", name)
}


#[tauri::command]
async fn get_peer_id(state: tauri::State<'_, MultiAddr>) -> Result<String,()> {
  let s = state.address.lock().await;
  let s1 = s.clone();
  Ok(s1)
}

#[tauri::command]
async fn dial(state: tauri::State<'_, SystemState>, id: &str) -> Result<(), ()> {
  let mut identify_sender = state.identify_sender.lock().await;
  println!("sending id {id}");
  identify_sender.send(String::from(id)).await;

  Ok(())
}

#[tauri::command]
async fn send_message( state: tauri::State<'_, SystemState>, msg: &str) -> Result<(), ()> {
    let mut msg_sender = state.msg_sender.lock().await;
    msg_sender.send(String::from(msg)).await;
    println!("sending message {msg}");
    Ok(())
}



#[derive(NetworkBehaviour)]
#[behaviour(to_swarm = "MyBehaviourEvent")]
 struct MyBehaviour {
  gossipsub: gossipsub::Behaviour,
  identify: identify::Behaviour,
  ping: ping::Behaviour,
}

 enum MyBehaviourEvent {
  Gossipsub(gossipsub::Event),
  Identify(identify::Event),
  Ping(ping::Event),
 }

impl From<gossipsub::Event> for MyBehaviourEvent {
  fn from(event: gossipsub::Event) -> Self {
    MyBehaviourEvent::Gossipsub(event)
  }
}

impl From<identify::Event> for MyBehaviourEvent {
  fn from(event: identify::Event) -> Self {
    MyBehaviourEvent::Identify(event)
  }
}

impl From<ping::Event> for MyBehaviourEvent {
  fn from(event: ping::Event) -> Self {
    MyBehaviourEvent::Ping(event)
  }
}

fn setup_swarm() -> Swarm<MyBehaviour>{
  let id_keys = identity::Keypair::generate_ed25519();
  let local_peer_id = PeerId::from(id_keys.public());
  println!("Local peer id: {local_peer_id}");

  let transport = build_transport(id_keys.clone(), Option::None);    
 
  let gossipsub_topic = gossipsub::IdentTopic::new("chat");
  
  let mut swarm = {
      let gossipsub_config = gossipsub::ConfigBuilder::default()
            .max_transmit_size(262144)
            .build()
            .expect("valid config");
        let identify = identify::Behaviour::new(identify::Config::new(
            "/ipfs/0.1.0".into(),
            id_keys.public(),
        ));
        let mut behaviour = MyBehaviour {
             gossipsub: gossipsub::Behaviour::new(
               gossipsub::MessageAuthenticity::Signed(id_keys.clone()),
                gossipsub_config,
            )
            .expect("Valid configuration"),
            identify,
          ping: ping::Behaviour::new(ping::Config::new()),  
        };
        behaviour.gossipsub.subscribe(&gossipsub_topic).unwrap();
        SwarmBuilder::with_async_std_executor(transport, behaviour, local_peer_id).build()
    };
    swarm.listen_on("/ip4/0.0.0.0/tcp/0".parse().unwrap()).unwrap();
    
    
    swarm
}

fn build_transport( key_pair: identity::Keypair,psk: Option<PreSharedKey>,) -> transport::Boxed<(PeerId, StreamMuxerBox)>{
  let noise_config = noise::Config::new(&key_pair).unwrap();
  let yamux_config = yamux::Config::default();

  let base_transport = tcp::async_io::Transport::new(tcp::Config::default().nodelay(true));
  let maybe_encrypted = match psk {
    Some(psk) => Either::Left(
      base_transport.and_then(move |socket, _| PnetConfig::new(psk).handshake(socket)),
        ),
    None => Either::Right(base_transport),
  };
  maybe_encrypted
        .upgrade(Version::V1Lazy)
        .authenticate(noise_config)
        .multiplex(yamux_config)
        .timeout(Duration::from_secs(20))
        .boxed()
}

/// parse a legacy multiaddr (replace ipfs with p2p), and strip the peer id
/// so it can be dialed by rust-libp2p
fn parse_legacy_multiaddr(text: &str) -> Result<Multiaddr, Box<dyn Error>> {
  let sanitized = text
        .split('/')
        .map(|part| if part == "ipfs" { "p2p" } else { part })
        .collect::<Vec<_>>()
        .join("/");
  let mut res = Multiaddr::from_str(&sanitized)?;
  strip_peer_id(&mut res);
  Ok(res)
}

/// for a multiaddr that ends with a peer id, this strips this suffix. Rust-libp2p
/// only supports dialing to an address without providing the peer id.
fn strip_peer_id(addr: &mut Multiaddr) {
  let last = addr.pop();
  match last {
    Some(Protocol::P2p(peer_id)) => {
      let mut addr = Multiaddr::empty();
      addr.push(Protocol::P2p(peer_id));
      println!("removing peer id {addr} so this address can be dialed by rust-libp2p");
    }
    Some(other) => addr.push(other),
    _ => {}
  }
}
