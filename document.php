<?php

if (!isset($_GET['id'])) {
	throw new Exception('ID is required');
}

switch ($_GET['id']) {

	case 'all':
		// get all HTML files in doc directory
		$filelist = glob('annotaria-td/*.html');
		// init output array
		$ret      = array();
		// loop on each doc
		foreach ($filelist as $file) {
			// skip index
			if ('index.html' == basename($file))
				continue;
			// get the title from HTML content
			$cont  = file_get_contents($file);
			$title = preg_match('!<title.*>(.*?)</title>!i', $cont, $matches) ? $matches[1] : $file;
			// add filepath and title to the output array
			$ret[] = array('href' => $file, 'doctitle' => $title);
		}
		// output array in JSON
		echo json_encode($ret);
		exit(0);

	case 'file':
		// TODO: check for filepath validity and avoid injectons and other bad things™
		// get the wanted file content
		$doc  = file_get_contents($_GET['filepath']);
		// get the body content only
		$body = preg_replace(array('!.*<body[^>]*>!', '!</body>.*!'), '', $doc);
		// mangle images path (since we're in the parent directory)
		$body = preg_replace('!src="images/!', 'src="annotaria-td/images/', $doc);
		// output everything and pray AngularJS is smart enough
		echo $body;
		exit(0);

	default:
		throw new Exception("Unrecognized ID");
}