O MatrUFSC foi escrito para substituir um serviço similar que existia para os
estudantes da UFSC, o GRAMA (GRAde de MAtrícula), que foi escrito por um
estudante de Engenharia de Produção e tinha o apoio da ufsc, pelo site
http://grama.ufsc.br

O GRAMA estava tecnologicamente defasado, tendo sido escrito no começo dos
anos 2000, não aproveitando facilidades como XMLHttpRequest e o poder de
processamento dos navegadores modernos.

O GRAMA perdeu o apoio da UFSC quando tentou se aproveitar da popularidade
do serviço para fazer propaganda própria da empresa criada pelo seu autor,
que acabara de se formar da UFSC.

Esse foi o momento propício para criar outro sistema que substituisse o GRAMA.
Foi então que o MatrUFSC surgiu, estando disponível inicialmente para o
período de matrícula do semestre 2012-1.

Vendo os erros e as falhas de outros serviços semelhantes, o MatrUFSC nasceu
com os seguintes princípios:
- Simplicidade e facilidade de uso:
  O aplicativo deve seguir o princípio KISS - Keep it Simple, Stupid, e deve
  ser simples e fácil de usar.
- Não ao culto de personalidade:
  Pouco importa para o usuário quem fez o sistema. Este não deve ser usado
  como meio de promoção individual ou comercial, salvo se for alguma
  instituição de alunos para alunos, sem fins comerciais ou outros interesses
  (por exemplo: algum centro acadêmico).
- Sem retorno financeiro:
  O site não deve ser poluído com propagandas e logos de apoio. Quem está
  tomando seu tempo para desenvolver o site deve ter como única recompensa o
  fato de saber que seu trabalho está sendo usado e apreciado por milhares de
  pessoas.
- Não ao acúmulo de dados pessoais dos usuários:
  Não existe necessidade nenhuma de ter os dados pessoais dos usuários no
  servidor. Nem e-mail, nem login, nem CPF (sério, tem site para
  "universitário" que pede até CPF no cadastro). O MatrUFSC permite ao
  usuário fazer download e upload de seu horário, sem precisar nem gravar
  nada no servidor. Os usuários podem usar qualquer identificador para
  gravar seus horários no sistema se quiserem.

(admito que depois de certo ponto não consegui mais seguir o princípio KISS =)

===========================================================================

LICENÇA

A ideia original era fazer o MatrUFSC ser código-livre, mas uma licença mais
comum de código livre (como a GPL) não restringiria o uso no servidor com
algumas restrições como "sem retorno financeiro". Fiquei sabendo da intenção
de algumas pessoas em pegar o código (caso fosse livre) e fazer seu próprio
serviço, com propagandas e acúmulo de informação dos usuários (para venda
de lista de e-mails), então acabei não liberando o código ainda.

===========================================================================
1. Servidor

Para rodar o MatrUFSC, é necessário ter os seguintes programas/pacotes
instalados no servidor:
- apache2
- FastCGI
- python2
- flup

2. Python

Se o seu executável python não reside em /usr/bin/python, você deve criar
um arquivo chamado "pythonpath" que contém o caminho correto. Por exemplo:
$ echo "$HOME/meupythoncomflup/bin/python" > pythonpath

Este caminho será substituido no arquivo dispatch.fcgi pelo Makefile.

3. Caminhos

O MatrUFSC gera arquivos de dados para cada identificador gravado e gera
arquivos de log para cada erro interno do dispatch.fcgi. O caminho para os
dados está em matrufsc.py, sendo "$HOME" substituido pelo Makefile. O caminho
para os logs está em dispatch.fcgi, sendo "$HOME" também substituido pelo
Makefile.

O MatrUFSC supõe que reside na subpasta /matrufsc, por exemplo:
ramiro.arrozcru.org/matrufsc

Para mudar a subpasta (ou tirar toda ela), edite o arquivo .htaccess e mude
o caminho em RewriteBase.

4. Banco de dados

O banco de dados é gerado usando os script py/get_turmas.py e
py/parse_turmas.py. Estes scripts são específicos para o sistema de
cadastro de disciplinas da UFSC.

get_turmas.py pega os dados do CAGR e os grava separados por semestre e campus.
O modo de usar é: ./py/get_turmas.py <username> <password> [semestre]
parse_turmas.py gera arquivos .json dos arquivos xml criados por get_turmas.
O modo de usar é: ./py/parse_turmas.py <arquivos de entrada> <arquivo de saída>

Os arquivos finais .json seguem a seguinte estrutura:

{ "<código do campus>" : [lista de disciplinas] }

Cada disciplina é uma lista com a seguinte estrutura:
[ "código da disciplina", "nome da disciplina em ascii e caixa alta", "nome da disciplina", [lista de turmas] ]

Cada turma é uma lista com a seguinte estrutura:
[ "nome_turma", horas_aula, vagas_ofertadas, vagas_ocupadas, alunos_especiais, saldo_vagas, pedidos_sem_vaga, [horarios], [professores]]

Os dados relativos a horas_aula e vagas são em números, não strings.
Os horários são no formato disponibilizado pela UFSC:
"2.1010-2 / ARA-ARA209"
 | |    |   |   \----- código da sala
 | |    |   \--------- código do departamento
 | |    \------------- número de aulas seguidas no bloco
 | \------------------ horário da primeira aula do bloco
 \-------------------- dia da semana

Os professores são dispostos numa lista de strings.

5. closure

É possível utilizar o closure compiler para reduzir o tamanho do javascript
final.

- Pegue o programa em https://developers.google.com/closure/compiler/
- Copie compiler.jar para algum path (como /usr/bin/compiler.jar)
- Torne o arquivo legível e executável (chmod a+xr /usr/bin/compiler.jar)
- Crie um script chamado closure on path (como /usr/bin/closure) que rode o compilador:
#!/bin/sh

/usr/bin/java -jar /usr/bin/compiler.jar $@
- Só é possível utilizar SIMPLE_OPTIMIZATIONS e não ADVANCED_OPTIMIZATIONS
  (provavelmente por causa do código do state que não permite renomear os
  campos aleatoriamente)

6. Makefile
Para compilar o MatrUFSC, basta rodar 'make'. Para compilar em modo release
(que habilita o facebook, google analytics e roda closure no javascript), use
RELEASE=1 make <...>
O que eu faço para instalar o MatrUFSC é:
make -j3 install-gz && cp -r install/* install/.htaccess "/<pasta_do_site>/matrufsc-<versao>"
tendo "matrufsc-<versao>" um symlink para "matrufsc", que vai ser acessado
pelo usuário.
