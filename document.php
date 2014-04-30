<?php

if (!isset($_GET['id'])) {
	throw new Exception('ID is required');
}

switch ($_GET['id']) {
	case 'all':
		$filelist = glob('annotaria-td/*.html');
		$ret      = array();
		foreach ($filelist as $file) {
			$cont  = file_get_contents($file);
			$title = preg_match('!<title.*>(.*?)</title>!i', $cont, $matches) ? $matches[1] : $file;
			$ret[] = array('filepath' => $file, 'doctitle' => $title);
		}
		echo json_encode($ret);
		exit(0);

	case 'file':
		$doc  = file_get_contents($_GET['filepath']);
		$body = preg_replace(array('!.*<body[^>]*>!', '!</body>.*!'), '', $doc);
		$body = preg_replace('!src="images/!', 'src="annotaria-td/images/', $doc);
		echo $body;
		exit(0);

	default:
		throw new Exception("Unrecognized ID");
}