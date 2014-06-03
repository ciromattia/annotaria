<?php
require_once __DIR__ . '/vendor/autoload.php';

$base  = dirname($_SERVER['PHP_SELF']);
// Update request when we have a subdirectory
if(ltrim($base, '/')){
	$_SERVER['REQUEST_URI'] = substr($_SERVER['REQUEST_URI'], strlen($base));
}

$klein = new \Klein\Klein();

$klein->respond('GET', '/articlelist', function ($request, $response) {
  $object = array();
  foreach (glob("*.html") as $filename) {
    $object[] = array(
      'href' => $filename,
      'title' => $filename
    );
  }
  $response->json($object, $request->param('callback', null));
});

$klein->respond('GET', '/article/[:article]', function ($request, $response) {
	global $base;
	if (file_exists($request->article)) {
		$mock = new DOMDocument;
		$dom = new DOMDocument;
		libxml_use_internal_errors(true);
		$dom->loadHTML(file_get_contents($request->article));
		libxml_clear_errors();
		$xpath = new DOMXPath($dom);
		$src = $xpath->query(".//@src");
		foreach ($src as $s) {
			$s->nodeValue = $base.'/'.$s->nodeValue;
		}
		$body = $dom->getElementsByTagName('body')->item(0);
		foreach ($body->childNodes as $child){
			$mock->appendChild($mock->importNode($child, true));
		}
		$output = substr($mock->saveXML(), 21);
		$response->json($output, $request->param('callback', null));
	}
});

$klein->dispatch();

