const VERSAO = {
  versao: "2.1.0",
  data: "2026-04-03",
  repo: "afsjr/analise_curriculo"
};

async function verificarVersaoGitHub() {
  const badge = document.getElementById("versao-badge");
  if (!badge) return;
  
  try {
    const response = await fetch(`https://api.github.com/repos/${VERSAO.repo}/commits/main`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (!response.ok) {
      return;
    }
    
    const data = await response.json();
    const latestCommit = data.sha.substring(0, 7);
    
    badge.title = `Último commit no GitHub: ${latestCommit}`;
    
  } catch (error) {
  }
}

document.addEventListener("DOMContentLoaded", () => {
  verificarVersaoGitHub();
});
