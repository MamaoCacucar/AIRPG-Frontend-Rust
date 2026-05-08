#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

// use tauri::api::process::Command;

// Comando para ler a pasta de campanhas (mockado para o teste de UI)
#[tauri::command]
fn get_campaigns() -> Vec<String> {
    // No futuro, isso usará o fs_manager para ler a pasta /Metadata ou SQLite
    vec![
        "A Queda de Eldoria".to_string(),
        "Cyber-Sampa 2077".to_string(),
        "O Mistério da Taverna".to_string(),
    ]
}

// O comando agora recebe a campanha e só é chamado após o clique na UI
#[tauri::command]
fn start_engine(campaign_name: String) -> Result<String, String> {
    println!("Iniciando backend Python para a campanha: {}", campaign_name);
    
    // O código de spawn real do sidecar ficaria aqui. 
    // Por enquanto, retornamos sucesso para testar a transição de tela no React.
    Ok(format!("Engine iniciada para {}", campaign_name))
}

fn main() {
    tauri::Builder::default()
        // Registra os comandos para o React enxergar
        .invoke_handler(tauri::generate_handler![get_campaigns, start_engine])
        .run(tauri::generate_context!())
        .expect("Erro ao iniciar a interface do Tauri");
}