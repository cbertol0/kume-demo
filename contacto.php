<?php
// Formulario de contacto de küme: recibe nombre, email y mensaje y los envía a info@kume.com.ar.
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

const DESTINO = 'info@kume.com.ar';
const REMITENTE = 'info@kume.com.ar';   // igual que el formulario de Elementor del sitio anterior
const NOMBRE_REMITENTE = 'Küme Alimento';
const ASUNTO = 'Nuevo Mensaje Vía Web Kume';

function responder($ok, $error = '', $codigo = 200) {
  http_response_code($codigo);
  echo json_encode(['ok' => $ok, 'error' => $error], JSON_UNESCAPED_UNICODE);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') responder(false, 'Método no permitido.', 405);

// Trampa para robots: campo oculto que una persona nunca completa
if (!empty($_POST['web'])) responder(true);

$limpiar = function ($v, $max) {
  $v = trim((string)($v ?? ''));
  $v = str_replace(["\r", "\0"], '', $v);
  return function_exists('mb_substr') ? mb_substr($v, 0, $max, 'UTF-8') : substr($v, 0, $max);
};
$nombre  = $limpiar($_POST['nombre'] ?? '', 120);
$email   = $limpiar($_POST['email'] ?? '', 160);
$mensaje = $limpiar($_POST['mensaje'] ?? '', 5000);

if ($nombre === '' || $mensaje === '') responder(false, 'Complete su nombre y su mensaje.', 422);
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) responder(false, 'Escriba un email válido.', 422);
$nombre = str_replace("\n", ' ', $nombre);

// Límite simple: un envío cada 30 segundos por visitante
@session_start();
if (!empty($_SESSION['ultimo_envio']) && time() - $_SESSION['ultimo_envio'] < 30) {
  responder(false, 'Espere unos segundos antes de volver a enviar.', 429);
}

$asunto = '=?UTF-8?B?' . base64_encode(ASUNTO) . '?=';
date_default_timezone_set('America/Argentina/Buenos_Aires');
$cuerpo = "Nombre: $nombre\nEmail: $email\nMensaje: $mensaje\n\n---\n"
        . 'Fecha: ' . date('d/m/Y') . "\nHora: " . date('H:i') . "\n"
        . "Página: https://kume.com.ar/#contacto\n";
$encabezados = implode("\r\n", [
  'From: =?UTF-8?B?' . base64_encode(NOMBRE_REMITENTE) . '?= <' . REMITENTE . '>',
  'Reply-To: ' . $email,
  'MIME-Version: 1.0',
  'Content-Type: text/plain; charset=UTF-8',
  'Content-Transfer-Encoding: 8bit',
]);

// Algunos servidores no aceptan el parámetro -f: si falla, se reintenta sin él
$enviado = @mail(DESTINO, $asunto, $cuerpo, $encabezados, '-f' . REMITENTE);
if (!$enviado) $enviado = @mail(DESTINO, $asunto, $cuerpo, $encabezados);
if (!$enviado) {
  $e = error_get_last();
  error_log('contacto.php: mail() falló: ' . ($e['message'] ?? 'sin detalle'));
  responder(false, 'No se pudo enviar. Escríbanos a info@kume.com.ar.', 500);
}
$_SESSION['ultimo_envio'] = time();
responder(true);
