<?php
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$root = '/home/u192544817/domains/datalisting.info/app/instalacion_nueva/Datalisting';
$routes = $root.'/routes/release.php';
$view = $root.'/resources/maquetas/mi-facultad.html';
$config = $root.'/config/release_checklist.php';
$old = "return response(file_get_contents(resource_path('maquetas/mi-facultad.html')));";
$new = "return redirect()->away('https://20facusam23.github.io/portfolio/sysacad/');";
try {
    if (!is_file($root.'/artisan') || !is_file($routes) || !is_file($config)) throw new RuntimeException('No se encontró la instalación esperada.');
    $source = file_get_contents($routes);
    if (substr_count($source,$old)!==1 && substr_count($source,$new)!==1) throw new RuntimeException('La ruta cambió. No se modificó nada.');
    $items = require $config;
    if (!is_array($items)) throw new RuntimeException('No se reconoció el listado de novedades.');
    foreach ($items as &$item) {
        if (($item['number']??null)===19) {
            $item['title']='Interfaz universitaria externa';
            $item['status']='Trasladada a GitHub';
            $item['detail']='La apariencia universitaria se aplica en el sitio oficial desde GitHub. La maqueta interna fue retirada; Hostinger no recibe credenciales ni datos de SysAcad.';
        }
    }
    unset($item);
    $backup=$root.'/storage/app/retiro-sysacad/'.gmdate('Ymd_His').'_'.bin2hex(random_bytes(3));
    if (!mkdir($backup,0700,true)) throw new RuntimeException('No se pudo crear el respaldo.');
    foreach ([$routes,$config,$view] as $f) if(is_file($f)&&!copy($f,$backup.'/'.basename($f))) throw new RuntimeException('No se pudo respaldar.');
    $next=str_replace($old,$new,$source);
    $configuration="<?php\nreturn ".var_export($items,true).";\n";
    foreach ([$routes=>$next,$config=>$configuration] as $path=>$contents) {
        $temp=$path.'.retiro-sysacad';
        if (file_put_contents($temp,$contents)!==strlen($contents)||!rename($temp,$path)) throw new RuntimeException('No se pudo actualizar '.$path.'. Respaldo: '.$backup);
    }
    if(is_file($view)&&!unlink($view)) throw new RuntimeException('La ruta ya redirige, pero falta retirar la copia HTML. Respaldo: '.$backup);
    echo "Maqueta interna retirada. La URL anterior redirige a GitHub.\nNo se modificaron organizaciones, base de datos ni otras integraciones.\nRespaldo: $backup\nAhora ejecutá php artisan config:clear y php artisan route:cache desde la aplicación.\n";
} catch(Throwable $e) { fwrite(STDERR,$e->getMessage()."\n");exit(1); }
