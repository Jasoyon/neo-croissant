use std::{path::PathBuf, time::Duration};
use shakmaty::{uci::UciMove, Position};
use crate::{engine::{parse_fen_to_position, BaseEngine, EngineOption, GoMode}, error::Error};

// A short-lived engine keeps hints separate from both the opponent and analysis tabs.
#[tauri::command]
#[specta::specta]
pub async fn get_game_hint(engine: String, fen: String, options: Vec<EngineOption>) -> Result<Option<String>, Error> {
    tokio::time::timeout(Duration::from_secs(10), async {
        let pos = parse_fen_to_position(&fen)?;
        if pos.is_game_over() { return Ok(None); }
        let mut process = BaseEngine::spawn(PathBuf::from(engine)).await?;
        process.init_uci().await?;
        for option in options { process.set_option(&option.name, &option.value).await?; }
        process.send("isready").await?;
        process.wait_for("readyok").await?;
        process.set_position(&fen, &[]).await?;
        process.go(&GoMode::Time(700)).await?;
        let reply = process.wait_for_bestmove().await?;
        UciMove::from_ascii(reply.as_bytes())?.to_move(&pos)?;
        process.quit().await?;
        Ok(Some(reply))
    }).await.map_err(|_| Error::from(std::io::Error::new(std::io::ErrorKind::TimedOut, "提示计算超时")))?
}

#[cfg(test)]
mod tests {
    use super::*;
    #[tokio::test]
    async fn terminal_position_needs_no_engine() {
        assert_eq!(get_game_hint("missing-engine".into(), "7k/5Q2/6K1/8/8/8/8/8 b - - 0 1".into(), vec![]).await.unwrap(), None);
    }
    #[tokio::test]
    #[ignore = "Requires NEO_TEST_ENGINE"]
    async fn real_hint_finds_mate_and_handles_black_to_move() {
        let path = std::env::var("NEO_TEST_ENGINE").unwrap();
        let fen = "7k/8/5KQ1/8/8/8/8/8 w - - 0 1";
        let reply = get_game_hint(path.clone(), fen.into(), vec![]).await.unwrap().unwrap();
        let mut pos = parse_fen_to_position(fen).unwrap();
        let m = UciMove::from_ascii(reply.as_bytes()).unwrap().to_move(&pos).unwrap();
        pos.play_unchecked(&m);
        assert!(pos.is_checkmate());
        let fen = "rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq - 0 1";
        let reply = get_game_hint(path, fen.into(), vec![]).await.unwrap().unwrap();
        UciMove::from_ascii(reply.as_bytes()).unwrap().to_move(&parse_fen_to_position(fen).unwrap()).unwrap();
    }
}
