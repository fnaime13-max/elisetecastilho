/* Tudo que a Elisete pode querer trocar fica aqui. */
window.CONFIG = {
  nome: 'Elisete Castilho',
  whatsapp: '5512981765852', // número do botão "AGENDAMENTO com a Nutri" do Linktree
  instagram: 'nutrielisetecastilho',
  crn: 'CRN-3 25623',
  mensagem: 'Olá, Elisete! Vi seu site e quero agendar uma consulta.'
};

window.linkWA = function (msg) {
  return 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(msg || CONFIG.mensagem);
};
