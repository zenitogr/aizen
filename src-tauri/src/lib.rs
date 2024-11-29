/* // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
} */
// Import functionalities we'll be using
use std::process;
use std::sync::Mutex;
use tauri::async_runtime::spawn;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager,
};

use tauri::{AppHandle, State};
use tokio::time::{sleep, Duration, timeout};

// Create a struct we'll use to track the completion of
// setup related tasks
struct SetupState {
    frontend_task: bool,
    backend_task: bool,
}

#[tauri::command]
fn kill_app() {
    process::exit(0);
}

// Our main entrypoint in a version 2 mobile compatible app
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Don't write code before Tauri starts, write it in the
    // setup hook instead!
    tauri::Builder::default()
        // Register a `State` to be managed by Tauri
        // We need write access to it so we wrap it in a `Mutex`
        .manage(Mutex::new(SetupState {
            frontend_task: false,
            backend_task: false,
        }))
        // Add the process plugin
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        // Add a command we can use to check
        .invoke_handler(tauri::generate_handler![greet, set_complete, kill_app])
        // Use the setup hook to execute setup related tasks
        // Runs before the main loop, so no windows are yet created
        .setup(|app| {
            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&quit_i])?;
            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .menu_on_left_click(true)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => {
                        println!("quit menu item was clicked");
                        app.exit(0);
                    }
                    _ => {
                        println!("menu item {:?} not handled", event.id);
                    }
                })
                .on_tray_icon_event(|tray, event| match event {
                    TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } => {
                        println!("left click pressed and released");
                        // in this example, let's show and focus the main window when the tray is clicked
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    _ => {
                        println!("unhandled event {event:?}");
                    }
                })
                .build(app)?;
            // Spawn setup as a non-blocking task so the windows can be
            // created and ran while it executes
            spawn(setup(app.handle().clone()));
            // The hook expects an Ok result
            Ok(())
        })
        // Run the app
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn greet(name: String) -> String {
    format!("Hello {name} from Rust!")
}

// A custom task for setting the state of a setup task
#[tauri::command]
async fn set_complete(
    app: AppHandle,
    state: State<'_, Mutex<SetupState>>,
    task: String,
) -> Result<(), ()> {
    let should_transition = {
        let mut state_lock = state.lock().unwrap();
        match task.as_str() {
            "frontend" => state_lock.frontend_task = true,
            "backend" => state_lock.backend_task = true,
            _ => panic!("invalid task completed!"),
        }
        state_lock.backend_task && state_lock.frontend_task
    };

    if should_transition {
        // Add error handling for window operations
        if let Some(splash_window) = app.get_webview_window("splashscreen") {
            // Handle animation failures gracefully
            let _ = splash_window.eval(
                "document.querySelector('.splash-container').classList.add('fade-out')"
            );
            
            sleep(Duration::from_millis(1000)).await;
            
            let _ = splash_window.eval(
                "document.querySelector('.tree-reveal').classList.add('show')"
            );
            
            sleep(Duration::from_millis(1200)).await;
            
            let _ = splash_window.close();
        }

        if let Some(main_window) = app.get_webview_window("main") {
            let _ = main_window.show();
        } else {
            println!("Warning: Main window not found during transition");
        }
    }
    Ok(())
}

// An async function that does some heavy setup task
async fn setup(app: AppHandle) -> Result<(), ()> {
    match timeout(Duration::from_secs(30), async {
        println!("Performing really heavy backend setup task...");
        sleep(Duration::from_secs(10)).await;
        println!("Backend setup task completed!");
        set_complete(
            app.clone(),
            app.state::<Mutex<SetupState>>(),
            "backend".to_string(),
        )
        .await
    })
    .await
    {
        Ok(result) => result,
        Err(_) => {
            println!("Setup timed out after 30 seconds");
            Err(())
        }
    }
}
