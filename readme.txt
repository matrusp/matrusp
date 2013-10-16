INTRODUÇÃO

O CAPIM foi escrito para substituir um serviço similar que existia para os
estudantes da UFSC, o GRAMA (GRAde de MAtrícula), que foi escrito por um
estudante de Engenharia de Produção e tinha o apoio da ufsc, pelo site
http://grama.ufsc.br

O GRAMA estava tecnologicamente defasado, não aproveitando facilidades como
XMLHttpRequest e o poder de processamento dos navegadores modernos.

O GRAMA perdeu o apoio da UFSC quando tentou se aproveitar da popularidade
do serviço para fazer propaganda própria da empresa criada pelo seu autor,
que acabara de se formar da UFSC.

Esse foi o momento propício para criar outro sistema que substituisse o GRAMA.
Foi então que o CAPIM surgiu, a princípio com o nome de MatrUFSC, estando
disponível inicialmente para o período de matrícula do semestre 2012-1.

Vendo os erros e as falhas de outros serviços semelhantes, o CAPIM nasceu
com os seguintes princípios:
- Simplicidade e facilidade de uso:
  O aplicativo deve seguir o princípio KISS - Keep it Simple, Stupid, e deve
  ser simples e fácil de usar.
- Não ao culto de personalidade:
  Pouco importa para o usuário quem fez o sistema. Este não deve ser usado
  como meio de promoção individual ou comercial, salvo se for alguma
  instituição de alunos para alunos, sem fins comerciais ou outros interesses
  (por exemplo: algum centro acadêmico). Créditos aos desenvolvedores devem
  ser dados em algum lugar discreto do aplicativo.
- Sem retorno financeiro:
  O site não deve ser poluído com propagandas e logos de apoio. Quem está
  tomando seu tempo para desenvolver o site deve ter como única recompensa o
  fato de saber que seu trabalho está sendo usado e apreciado por milhares de
  pessoas.
- Não ao acúmulo de dados pessoais dos usuários:
  Não existe necessidade nenhuma de ter os dados pessoais dos usuários no
  servidor. Nem e-mail, nem login, nem CPF (sério, tem site para
  "universitário" que pede até CPF no cadastro). O CAPIM permite ao
  usuário fazer download e upload de seu horário, sem precisar nem gravar
  nada no servidor. Os usuários podem usar qualquer identificador para
  gravar seus horários no sistema se quiserem.

(admito que depois de certo ponto não consegui mais seguir o princípio KISS =)

===========================================================================

LICENÇA

A ideia original era fazer o CAPIM ser código-livre. Porém, as licenças
mais comuns (como a GPL) não atenderiam a algumas restrições que eu gostaria
de impor ao código. Portanto, aqui defino a licença do CAPIM:

1. É proibido qualquer tipo de retorno financeiro, direta ou indiretamente,
   como, por exemplo:
   - o uso de propagandas, divulgação, apoio, troca de favores ou serviços
     afins no próprio site do aplicativo, em qualquer site que leve ao
     aplicativo e em qualquer site relacionado ao aplicativo;
   - cobrar pela utilização do serviço ou qualquer serviço adicional;
   - a venda de informações dos usuários;
2. É proibido o acúmulo de informações pessoais dos usuários, exceto pelos
   próprios horários que eles mesmos salvarem com um identificador de escolha
   deles;
3. É proibida a promoção pessoal do(s) desenvolvedor(es), exceto por uma
   menção em uma janela discreta para esta finalidade. Esta janela só deve
   aparecer quando solicitada pelo usuário e deve conter crédito para todos
   os desenvolvedores envolvidos, atuais e passados;
4. São permitidos o desenvolvimento e distribuição independentes do projeto,
   contanto que seja mantida esta licença e seja usado outro nome para o
   projeto;
5. O código fonte deve ser disponibilizado em algum repositório público, cujo
   endereço deve ser promovido em algum lugar do aplicativo;
6. Toda alteração ao código também deve obedecer a esta licença.

===========================================================================
1. Servidor

Para rodar o CAPIM, é necessário ter os seguintes programas/pacotes
instalados no servidor:
- apache2
- FastCGI
- python2
- flup

No ubuntu, os comandos são:
$ sudo apt-get install apache2 libapache2-mod-fcgid python-flup
$ sudo a2enmod rewrite

Certifique-se que na configuração de seu site no apache2 ExecCGI esteja
habilitado e os arquivos .htaccess também:
    Options +ExecCGI
    AllowOverride All

2. Caminhos

O CAPIM gera arquivos de dados para cada identificador gravado e gera
arquivos de log para cada erro interno do dispatch.fcgi. O caminho para os
dados está em capim.py e o caminho para os logs está em dispatch.fcgi.
Ambos são substituídos pelo Makefile pelo valor configurado por --base-path.

3. Banco de dados

O banco de dados é gerado por código em outro repositório:
http://git.arrozcru.org/?p=matrufsc_dbs.git;a=summary

Se você não quiser usar o repositório git, basta pegar os arquivos já gerados
para uso no MatrUFSC e colocá-los na pasta do aplicativo instalado no servidor:
http://ramiro.arrozcru.org/matrufsc/20121.json
http://ramiro.arrozcru.org/matrufsc/20121.json.gz
http://ramiro.arrozcru.org/matrufsc/20122.json
http://ramiro.arrozcru.org/matrufsc/20122.json.gz
http://ramiro.arrozcru.org/matrufsc/20131.json
http://ramiro.arrozcru.org/matrufsc/20131.json.gz
http://ramiro.arrozcru.org/matrufsc/20132.json
http://ramiro.arrozcru.org/matrufsc/20132.json.gz
http://ramiro.arrozcru.org/matrufsc/20141.json
http://ramiro.arrozcru.org/matrufsc/20141.json.gz

4. closure

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

5. build system
Para compilar o CAPIM, é necessário primeiro configurá-lo. Use o script
configure, passando as seguintes opções:
  --python-bin=<caminho>  caminho do executável do python no servidor
  --release               habilita otimização, facebook e google analytics
  --base-path=<caminho>   caminho da pasta principal do capim no servidor
  --subdir=<caminho>      subdiretório em que o capim se encontra no site
  --cgi                   usar cgi no lugar de fcgi

Somente a opção --base-path é obrigatório, sendo o resto opcional. Em seguida,
basta rodar 'make'.

O que eu faço para instalar o CAPIM é:
$ ./configure --base-path=$HOME/matrufsc --subdir=matrufsc
$ make install-gz && cp -r install/* install/.htaccess "/<pasta_do_site>/matrufsc-<versao>"
tendo "matrufsc-<versao>" um symlink para "matrufsc", que vai ser acessado
pelo usuário.
