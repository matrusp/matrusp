#!/usr/bin/python
# -*- coding: utf8 -*-

import gzip
from email.utils import formatdate
from email.utils import parsedate
import calendar
import os

arquivos = { 'index.html'   : { 'content_type': 'text/html'              },
             'matrufsc.js'  : { 'content_type': 'application/javascript' },
             'matrufsc.css' : { 'content_type': 'text/css'               },
             '20121.json'   : { 'content_type': 'application/json'       },
             '20122.json'   : { 'content_type': 'application/json'       },
             '20131.json'   : { 'content_type': 'application/json'       },
           }

dados_prefix = '$BASE_PATH/dados3/'

# based on urlparse.py:parse_qs
def get_q(qs):
    pairs = [s2 for s1 in qs.split('&') for s2 in s1.split(';')]
    for name_value in pairs:
        if not name_value:
            continue
        nv = name_value.split('=', 1)
        if len(nv) != 2:
            continue
        if nv[0] == 'q':
            return nv[1]
    raise IOError
def encoded_fname(environ):
    return get_q(environ['QUERY_STRING']).encode('hex') + '.json'

def run(environ, start_response):

#    start_response('404 Not Found', [('Content-Type', 'text/html; charset=UTF-8')])
#    return [str(environ)]

    path = environ['PATH_INFO'][1:].split('/')
    use_gzip = False
    try:
        if 'gzip' in environ['HTTP_ACCEPT_ENCODING'].split(','):
            use_gzip = True
    except KeyError:
        pass

    path0 = path[0]
    if path0 == '' and environ['PATH_INFO'][0] == '/':
        path0 = 'index.html'

    if path0 in arquivos:
        arquivo = arquivos[path0]

        if not 'uncompressed_length' in arquivo:
            fname = path0
            fp = open(fname, 'rb')
            arquivo['uncompressed_data'  ] = fp.read()
            fp.close()
            arquivo['uncompressed_length'] = str(os.path.getsize(fname))
            arquivo['last_modified_time' ] = os.path.getmtime(fname)
            arquivo['last_modified_str'  ] = formatdate(arquivo['last_modified_time'], False, True)

        try:
            since_time = calendar.timegm(parsedate(environ['HTTP_IF_MODIFIED_SINCE']))
            if arquivo['last_modified_time'] <= since_time:
                start_response('304 Not Modified', [])
                return ['']
        except KeyError:
            pass

        content_length = arquivo['uncompressed_length']
        content = arquivo['uncompressed_data']
        content_encoding = None

        if use_gzip:
            if not 'compressed_length' in arquivo:
                fname = path0 + '.gz'
                fp = open(fname, 'rb')
                arquivo['compressed_data'  ] = fp.read()
                fp.close()
                arquivo['compressed_length'] = str(os.path.getsize(fname))

            content_length = arquivo['compressed_length']
            content = arquivo['compressed_data']
            content_encoding = 'gzip'

        headers = [('Content-Type', arquivo['content_type']),
#                  ('Expires', '-1'),
                   ('Last-Modified', arquivo['last_modified_str']),
                   ('X-Uncompressed-Content-Length', arquivo['uncompressed_length']),
                   ('Content-Length', content_length),
                  ]

        if content_encoding is not None:
            headers.append(('Content-Encoding', content_encoding))

        start_response('200 OK', headers)
        return [content]

    elif path0 == 'load2.cgi':
        fname = encoded_fname(environ)
        data = None
        headers = [('Content-Type', 'application/json'), ('Expires', '-1')]
        try:
            # os arquivos estão em gzip. se gzip for pedido, o arquivo é
            # aberto normalmente e não é decodificado
            if use_gzip:
                fp = open(dados_prefix + fname + '.gz', 'rb')
                headers.append(('Content-Encoding', 'gzip'))
            else:
                fp = gzip.open(dados_prefix + fname + '.gz', 'rb')
            data = fp.read()
            fp.close()
        except IOError:
            pass
        if data is None:
            data = ''
        start_response('200 OK', headers)
        return [data]
    elif path0 == 'save2.cgi':
        fname = encoded_fname(environ)
        data = environ['wsgi.input'].read()
        fp = gzip.open(dados_prefix + fname + '.gz', 'wb')
        fp.write(data)
        fp.close()
        start_response('200 OK', [('Content-Type', 'text/html'), ('Expires', '-1')])
        return ['OK']
    elif path0 == 'ping.cgi':
        content_disposition = 'attachment; filename=' + get_q(environ['QUERY_STRING']) + '.json'
        data = environ['wsgi.input'].read().split('\r\n\r\n')[1].split('\r\n')[0]
        start_response('200 OK', [('Content-Type', 'application/octet-stream'), ('Content-Disposition', content_disposition), ('Expires', '-1')])
        return [data]
    elif path0 == 'robots.txt':
        start_response('200 OK', [('Content-Type', 'text/plain')])
        data = "User-agent: *\nDisallow: /\n"
        return [data]

    raise IOError
