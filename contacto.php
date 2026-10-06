<?php
// Formulario de contacto de küme: recibe nombre, email y mensaje y los envía a info@kume.com.ar.
// Envía por SMTP autenticado (DonWeb/Ferozo); los datos de la casilla están en contacto-config.php,
// que vive solo en el servidor (no está en GitHub).
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

const DESTINO = 'info@kume.com.ar';
const REMITENTE = 'info@kume.com.ar';   // igual que el formulario de Elementor del sitio anterior
const NOMBRE_REMITENTE = 'Küme Alimento';
const ASUNTO = 'Nuevo Mensaje Vía Web Kume';

function responder($ok, $error = '', $codigo = 200, $detalle = '') {
  http_response_code($codigo);
  $r = ['ok' => $ok, 'error' => $error];
  if ($detalle !== '') $r['detalle'] = $detalle;
  echo json_encode($r, JSON_UNESCAPED_UNICODE);
  exit;
}
const ERROR_ENVIO = 'No se pudo enviar. Escríbanos a info@kume.com.ar.';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') responder(false, 'Método no permitido.', 405);

// Trampa para robots: campo oculto que una persona nunca completa
if (!empty($_POST['web'])) responder(true);

function limpiar($v, $max) {
  $v = trim((string)$v);
  $v = str_replace(["\r", "\0"], '', $v);
  return function_exists('mb_substr') ? mb_substr($v, 0, $max, 'UTF-8') : substr($v, 0, $max);
}
$nombre  = limpiar(isset($_POST['nombre']) ? $_POST['nombre'] : '', 120);
$email   = limpiar(isset($_POST['email']) ? $_POST['email'] : '', 160);
$mensaje = limpiar(isset($_POST['mensaje']) ? $_POST['mensaje'] : '', 5000);

if ($nombre === '' || $mensaje === '') responder(false, 'Complete su nombre y su mensaje.', 422);
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) responder(false, 'Escriba un email válido.', 422);
$nombre = str_replace("\n", ' ', $nombre);

// Límite simple: un envío cada 30 segundos por visitante
@session_start();
if (!empty($_SESSION['ultimo_envio']) && time() - $_SESSION['ultimo_envio'] < 30) {
  responder(false, 'Espere unos segundos antes de volver a enviar.', 429);
}

date_default_timezone_set('America/Argentina/Buenos_Aires');
$cuerpo = "Nombre: $nombre\nEmail: $email\nMensaje: $mensaje\n\n---\n"
        . 'Fecha: ' . date('d/m/Y') . "\nHora: " . date('H:i') . "\n"
        . "Página: https://kume.com.ar/#contacto\n";

$config = is_file(__DIR__ . '/contacto-config.php') ? include __DIR__ . '/contacto-config.php' : null;
// El remitente es la casilla con la que se entra al SMTP (el servidor no deja enviar "en nombre de" otra)
$remitente = (is_array($config) && !empty($config['usuario'])) ? $config['usuario'] : REMITENTE;

$b64 = function ($s) { return '=?UTF-8?B?' . base64_encode($s) . '?='; };
$asunto = $b64(ASUNTO);
$de = $b64(NOMBRE_REMITENTE) . ' <' . $remitente . '>';

if (is_array($config) && !empty($config['clave']) && $config['clave'] !== 'PEGAR_AQUI_LA_CLAVE') {
  $res = enviar_smtp($config, $remitente, DESTINO, $de, $email, $asunto, $cuerpo);
  if ($res !== true) {
    error_log('contacto.php SMTP: ' . $res);
    responder(false, ERROR_ENVIO, 500, 'smtp: ' . $res);
  }
} elseif (function_exists('mail')) {
  $enc = "From: $de\r\nReply-To: $email\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit";
  if (!@mail(DESTINO, $asunto, $cuerpo, $enc)) responder(false, ERROR_ENVIO, 500, 'mail() devolvió falso');
} else {
  responder(false, ERROR_ENVIO, 500, 'sin SMTP configurado y mail() deshabilitado');
}

$_SESSION['ultimo_envio'] = time();
responder(true);

/* ---------- Envío SMTP mínimo (SSL 465 o STARTTLS 587, AUTH LOGIN) ---------- */
function enviar_smtp($c, $desde, $para, $de, $responderA, $asunto, $cuerpo) {
  $host = $c['host']; $puerto = (int)(isset($c['puerto']) ? $c['puerto'] : 465);
  $ctx = stream_context_create(['ssl' => ['verify_peer' => false, 'verify_peer_name' => false]]);
  $dest = ($puerto === 465 ? 'ssl://' : 'tcp://') . $host . ':' . $puerto;
  $s = @stream_socket_client($dest, $errno, $errstr, 15, STREAM_CLIENT_CONNECT, $ctx);
  if (!$s) return "no conecta a $host:$puerto ($errstr)";
  stream_set_timeout($s, 15);
  $leer = function () use ($s) { $r = ''; while (($l = fgets($s, 515)) !== false) { $r .= $l; if (isset($l[3]) && $l[3] === ' ') break; } return $r; };
  $cmd = function ($t, $ok) use ($s, $leer) { if ($t !== null) fwrite($s, $t . "\r\n"); $r = $leer(); return in_array(substr($r, 0, 3), (array)$ok, true) ? true : trim($r); };
  $paso = function ($r, $que) { if ($r !== true) throw new Exception("$que: $r"); };
  try {
    $paso($cmd(null, '220'), 'saludo');
    $paso($cmd('EHLO kume.com.ar', '250'), 'EHLO');
    if ($puerto === 587) {
      $paso($cmd('STARTTLS', '220'), 'STARTTLS');
      if (!stream_socket_enable_crypto($s, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) throw new Exception('TLS');
      $paso($cmd('EHLO kume.com.ar', '250'), 'EHLO2');
    }
    $paso($cmd('AUTH LOGIN', '334'), 'AUTH');
    $paso($cmd(base64_encode($c['usuario']), '334'), 'usuario');
    $paso($cmd(base64_encode($c['clave']), '235'), 'clave');
    $paso($cmd("MAIL FROM:<$desde>", '250'), 'MAIL FROM');
    $paso($cmd("RCPT TO:<$para>", ['250', '251']), 'RCPT TO');
    $paso($cmd('DATA', '354'), 'DATA');
    $msg = "From: $de\r\nTo: <$para>\r\nReply-To: <$responderA>\r\nSubject: $asunto\r\n"
         . 'Date: ' . date('r') . "\r\nMessage-ID: <" . bin2hex(random_bytes(8)) . "@kume.com.ar>\r\n"
         . "MIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n"
         . chunk_split(base64_encode($cuerpo)) . "\r\n.";
    $paso($cmd($msg, '250'), 'envío');
    $cmd('QUIT', '221');
    fclose($s);
    return true;
  } catch (Exception $e) {
    @fclose($s);
    return $e->getMessage();
  }
}
