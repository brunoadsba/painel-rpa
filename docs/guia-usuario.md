# Guia do Usuário — Torre RPA

> Para quem usa o painel no dia a dia. Sem termos técnicos.

## 1. O que é a Torre RPA

É o painel onde ficam todos os robôs (automações) da operação. Você entra, escolhe o robô, aperta executar e acompanha o resultado. Tudo num lugar só.

## 2. Como entrar

- Endereço local (na máquina do escritório): `http://localhost:5173`
- Se o painel não abrir, avise o responsável: o servidor pode estar desligado.

## 3. A tela inicial

- **Faixa ★ SEV Intermarítima:** é o robô principal. Clique para ver detalhes, versões e manual.
- **Busca:** digite parte do nome para achar um robô.
- **Filtros:** Todas, Prontas, Executando, Concluídas, Falhas.
- **Cartão de cada robô:** nome, o que ele faz, quando rodou por último e o botão **Executar**.

Situação de cada robô (bolinha colorida):

| Mostra | Significa |
|---|---|
| Pronta | Pode executar agora |
| Executando | Está rodando, aguarde |
| Concluída | Terminou bem da última vez |
| Falha | Deu erro da última vez, veja os registros |

## 4. Como executar um robô (passo a passo)

1. Clique em **Executar** no cartão do robô.
2. Digite seu **usuário e senha do OpenPort** na janela que abre.
3. Clique em **Autenticar e Executar**.
4. Acompanhe a janelinha de execução no canto da tela (ela mostra o que o robô está fazendo).
5. No fim aparece **concluído** ou **falha**. Se falhar, leia a última mensagem de erro.

Regras importantes:

- Cada execução pede login de novo. É de propósito (segurança).
- Não feche a aba no meio da execução.
- Só rode 1 vez por robô de cada vez. Se já estiver executando, o botão trava.

## 5. Página do SEV Intermarítima (robô principal)

Na página do SEV você encontra:

- **Versões:** QAS (testes) e PRODUÇÃO (cliente). Sempre use a versão certa para cada caso.
- **Manual de execução:** passo a passo para rodar o programa no Windows do cliente.
- **Como atualizar:** baixe pelo link privado da versão nova (o WhatsApp só avisa, não é por ele que se baixa).
- **Registro:** depois de rodar no cliente, anote no painel data, cliente, quantas SEVs e erros (o programa do cliente não manda isso sozinho).

## 6. Se der erro

1. Leia a mensagem na janela de execução (ela diz o motivo).
2. Erros comuns e o que fazer:

| Mensagem | O que fazer |
|---|---|
| Usuário ou senha inválidos | Confira login do OpenPort e tente de novo |
| Robô já está em execução | Aguarde terminar, não clique de novo |
| Tempo esgotado | Tente de novo; se repetir, avise o responsável |
| Falha ao carregar automações | O servidor caiu — avise o responsável |

3. Se o erro repetir 2 vezes, pare e chame o responsável. Não fique clicando.

## 7. Perguntas frequentes

- **Preciso instalar algo?** Não. Só o navegador.
- **Funciona no celular?** Sim, a tela se adapta.
- **Onde o robô roda?** No servidor da Torre (menos o SEV do cliente, que roda no Windows do cliente).
- **Meus dados ficam salvos?** Sua senha não. Só fica registrado quem executou e quando.
- **Quem pode executar?** Quem tiver login do OpenPort.

## 8. Glossário rápido

- **Robô/RPA:** programa que faz tarefa repetitiva sozinho.
- **Hub/Torre:** este painel central.
- **SEV:** documento de entrada de veículo no porto.
- **QAS:** ambiente de teste. **PRODUÇÃO:** ambiente real do cliente.
- **OpenPort:** sistema do porto onde os robôs trabalham.
