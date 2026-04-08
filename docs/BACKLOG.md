# BACKLOG: FRONTEND & RUST CORE

## FASE 1: RUST INFRA (ORQUESTRADOR)
- **ÉPICO: Command Dispatcher em Rust**
    - Criar `tauri::command` que recebe o input bruto do React.
    - Implementar Regex para detectar comandos iniciados por `/`.
    - Integrar lógica de "Hot-Swap" de contexto ao detectar `/load`.
- **ÉPICO: Sistema de Log de Alta Performance**
    - Configurar `tracing-subscriber` para gerar `session.log` rotativo.
    - Implementar canal de telemetria para o Python injetar logs no log do Rust.
- **ÉPICO: VRAM Swap Manager**
    - Implementar lógica de detecção de processo para Kobold e Comfy.
    - Criar função de `kill_process_by_name` e `spawn_sidecar` para gestão dinâmica de memória.

## FASE 2: FILESYSTEM & PERSISTÊNCIA (RUST)
- **ÉPICO: AssetBridge 2.0 (Native)**
    - Implementar `walker` de diretórios para `/Assets/Scenery` e `/Assets/Characters`.
    - Criar cache em memória (HashMap) das metatags para busca instantânea.
- **ÉPICO: Save/Load Engine**
    - Desenvolver serialização de `SaveState` em Rust.
    - Garantir que a deleção de save (`/save -d`) limpe também os arquivos físicos e envie sinal para o Python limpar o ChromaDB.

## FASE 3: UI & UX (REACT + TAURI)
- **ÉPICO: Terminal de Texto Inteligente**
    - Implementar suporte a blocos multimodais (`>`, `"`, `$`, `#`).
    - Criar sistema de Auto-complete para `@tags` consultando o cache do Rust.
- **ÉPICO: HUD de Status (Dashboard)**
    - Criar componentes de barra de progresso para Vida/Mana.
    - Implementar Modal de detalhes de entidade (Click-to-Tag).
- **ÉPICO: Gerenciador de Assets Visual**
    - Criar galeria de imagens para o "Atlas Local" com Lazy Loading nativo do Tauri.