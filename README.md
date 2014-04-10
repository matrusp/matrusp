Introdução
==========
O **CAPIM** foi escrito para substituir um serviço similar que existia para os
estudantes da UFSC, o **GRAMA** (GRAde de MAtrícula), que foi escrito por um
estudante de Engenharia de Produção e tinha o apoio da universidade, pelo site
http://grama.ufsc.br (desativado).

O GRAMA estava tecnologicamente defasado, não aproveitando facilidades como
*XMLHttpRequest* e o poder de processamento dos navegadores modernos.

O GRAMA perdeu o apoio da UFSC quando tentou se aproveitar da popularidade do
serviço para fazer propaganda própria da empresa criada pelo seu autor, que
acabara de se formar da UFSC.

Esse foi o momento propício para criar outro sistema que substituisse o GRAMA.
Foi então que o CAPIM surgiu, a princípio com o nome de MatrUFSC, estando
disponível inicialmente para o período de matrícula do semestre 2012-1.

Vendo os erros e as falhas de outros serviços semelhantes, o CAPIM nasceu com
os seguintes princípios:
- Simplicidade e facilidade de uso:
  O aplicativo deve seguir o princípio KISS - Keep it Simple, Stupid, e deve
  ser simples e fácil de usar.
- Não ao culto de personalidade:
  Pouco importa para o usuário quem fez o sistema. Este não deve ser usado como
  meio de promoção individual ou comercial, salvo se for alguma instituição de
  alunos para alunos, sem fins comerciais ou outros interesses (por exemplo:
  algum centro acadêmico). Créditos aos desenvolvedores devem ser dados em
  algum lugar discreto do aplicativo.
- Sem retorno financeiro:
  O site não deve ser poluído com propagandas e logos de apoio. Quem está
  tomando seu tempo para desenvolver o site deve ter como única recompensa o
  fato de saber que seu trabalho está sendo usado e apreciado por milhares de
  pessoas.
- Não ao acúmulo de dados pessoais dos usuários:
  Não existe necessidade nenhuma de ter os dados pessoais dos usuários no
  servidor. Nem e-mail, nem login, nem CPF (sério, tem site para
  **universitário** que pede até CPF no cadastro). O CAPIM permite ao usuário
  fazer download e upload de seu horário, sem precisar nem gravar nada no
  servidor. Os usuários podem usar qualquer identificador para gravar seus
  horários no sistema se quiserem.

(admito que depois de certo ponto não consegui mais seguir o princípio KISS =)

-----

Licença
=======
A ideia original era fazer o CAPIM ser código-livre. Porém, as licenças mais
comuns (como a GPL) não atenderiam a algumas restrições que eu gostaria de
impor ao código. Portanto, aqui defino a licença do CAPIM:

1. É proibido qualquer tipo de retorno financeiro, direta ou indiretamente,
   como, por exemplo:
   - o uso de propagandas, divulgação, apoio, troca de favores ou serviços
   afins no próprio site do aplicativo, em qualquer site que leve ao aplicativo
   e em qualquer site relacionado ao aplicativo;
   - cobrar pela utilização do serviço ou qualquer serviço adicional;
   - a venda de informações dos usuários;
2. É proibido o acúmulo de informações pessoais dos usuários, exceto pelos
   próprios horários que eles mesmos salvarem com um identificador de escolha
   deles;
3. É proibida a promoção pessoal do(s) desenvolvedor(es), exceto por uma menção
   em uma janela discreta para esta finalidade. Esta janela só deve aparecer
   quando solicitada pelo usuário e deve conter crédito para todos os
   desenvolvedores envolvidos, atuais e passados;
4. São permitidos o desenvolvimento e distribuição independentes do projeto,
   contanto que seja mantida esta licença e seja usado outro nome para o
   projeto;
5. O código fonte deve ser disponibilizado em algum repositório público, cujo
   endereço deve ser promovido em algum lugar do aplicativo;
6. Toda alteração ao código também deve obedecer a esta licença.

-----

Servidor
========
Para rodar o CAPIM, é necessário ter os seguintes programas/pacotes instalados
no servidor:
- Apache 2 **ou** Nginx
- FastCGI
- Python 2
- Flup e OSDLib para Python 2

Apache
------
No Ubuntu, os comandos são:
```
$ sudo apt-get install apache2 libapache2-mod-fcgid python-flup
$ sudo a2enmod rewrite

$ sudo apt-get install python-pip
$ sudo pip install odslib
```

Certifique-se que na configuração de seu site no Apache 2 ExecCGI esteja
habilitado e os arquivos .htaccess também:
```
Options +ExecCGI
AllowOverride All
```

Nginx
-----
No Ubuntu e outras distros Debian-based, os pacotes a instalar são:
```
$ sudo apt-get install nginx spawn-fcgi python-pip
$ sudo pip install flup odslib
```

Usamos o `spawn-fcgi` para criar um processo FastCGI, já que o Nginx não
permite por padrão. Da pasta que contém `dispatch.fcgi`:
```
$ spawn-fcgi -p 9000 -- dispatch.fcgi
```

O bloco do Nginx deve conter um redirecionamento para a porta local 9000:
```
location / {
  try_files $uri $uri/ /index.html;

  location ~ \.cgi$ {
    include fastcgi_params;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    fastcgi_pass 127.0.0.1:9000;
  }
}
```
Assim podemos ter certeza que o Nginx buscará arquivos quando solicitado, mas
passará as requisições de scripts para a porta correta. Não é necessário usar a
porta 9000, mas mantenha o padrão.

Caminhos
--------
O CAPIM gera arquivos de dados para cada identificador gravado e gera arquivos
de log para cada erro interno do dispatch.fcgi. O caminho para os dados está em
capim.py e o caminho para os logs está em dispatch.fcgi. Ambos são substituídos
pelo Makefile pelo valor configurado por --base-path. Por exemplo, passando
--base-path=$HOME/matrufsc, a estrutura das pastas fica sendo:
```
$HOME/matrufsc/dados3
$HOME/matrufsc/logs
```
Estas pastas não devem ser acessíveis pelo usuário que acessa o servidor! Você
precisa ter certeza que estas pastas podem ser escritas pelo processo do Apache
ou do Nginx.

Banco de dados
--------------
O banco de dados é gerado por código em [outro repositório]
(https://github.com/ramiropolla/matrufsc_dbs.git). Se você não quiser usar o
repositório git, basta pegar os arquivos já gerados
para uso no MatrUFSC e colocá-los na pasta do aplicativo instalado no servidor:
- http://ramiro.arrozcru.org/matrufsc/20121.json
- http://ramiro.arrozcru.org/matrufsc/20121.json.gz
- http://ramiro.arrozcru.org/matrufsc/20122.json
- http://ramiro.arrozcru.org/matrufsc/20122.json.gz
- http://ramiro.arrozcru.org/matrufsc/20131.json
- http://ramiro.arrozcru.org/matrufsc/20131.json.gz
- http://ramiro.arrozcru.org/matrufsc/20132.json
- http://ramiro.arrozcru.org/matrufsc/20132.json.gz
- http://ramiro.arrozcru.org/matrufsc/20141.json
- http://ramiro.arrozcru.org/matrufsc/20141.json.gz

Closure
-------
É possível utilizar o Closure Compiler para reduzir o tamanho do Javascript
final. O Closure só é usado em modo release (habilitado pelo configure).
- Pegue o programa em https://developers.google.com/closure/compiler/
- Copie compiler.jar para algum path (como /usr/bin/compiler.jar)
- Torne o arquivo legível e executável (chmod a+xr /usr/bin/compiler.jar)
- Crie um script chamado closure no path (como /usr/bin/closure) que rode o compilador:
```
#!/bin/sh

/usr/bin/java -jar /usr/bin/compiler.jar $@
```
Só é possível utilizar SIMPLE_OPTIMIZATIONS e não ADVANCED_OPTIMIZATIONS
(provavelmente por causa do código do state que não permite renomear os campos
aleatoriamente)

Build system
============
Para compilar o CAPIM, é necessário primeiro configurá-lo. Use o script
configure, passando as seguintes opções:

- --python-bin=&lt;caminho&gt;  caminho do executável do python no servidor
- --release               habilita otimização, facebook e google analytics
- --base-path=&lt;caminho&gt;   caminho da pasta principal do capim no servidor onde
                          serão guardados os horários dos usuários e os logs de
                          erro, por exemplo: /home/user/matrufsc 
    										  (não deixe estes arquivos expostos pelo servidor)
- --subdir=&lt;caminho&gt;      subdiretório em que o capim se encontra no site, por
                          exemplo: example.com/&lt;caminho&gt;
- --cgi                   usar cgi no lugar de fcgi

Somente a opção --base-path é obrigatória, sendo o resto opcional. Em seguida,
basta rodar `make`.

O que eu faço para instalar o CAPIM é:
```
$ ./configure --base-path=$HOME/matrufsc --subdir=matrufsc
$ make install-gz && cp -r install/* install/.htaccess "/<pasta_do_site>/matrufsc-<versao>"
```

"matrufsc-&lt;versao&gt;" é um symlink para "matrufsc", que vai ser acessado pelo usuário.

Não se esqueça de copiar os arquivos dos bancos de dados pra pasta na qual o sistema está instalado.

Troubleshooting
===============
- Dá erro na hora de carregar os bancos de dados.

  Lembre-se de copiá-los a partir do outro repositório, o matrufsc_dbs.
- Dá erro 404 quando tento salvar/abrir.

  Confere se o .htaccess tá funcionando direito. Olha a seção 1 e vê se o
  ExecCGI e o AllowOverride estão certo mesmo.
- Dá erro 500 quando tento abrir qualquer coisa.

  Confere o error.log do apache2. Se for por causa do ods.py, você
  provavelmente não instalou o odslib. Olha na seção 1 pra ver como fazer. Se
  você estiver em um ambiente compartilhado, crie um virtualenv próprio para
  sua instalação de Python (procure no Google como fazer isso).
