<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>DoniSanté</title>
  <link rel="icon" href="/DoniSante-icon.png" type="image/png">
  <link rel="apple-touch-icon" href="/DoniSante-icon.png">
  <link rel="preconnect" href="https://fonts.bunny.net">
  <link href="https://fonts.bunny.net/css?family=dm-sans:400,500,600,700|figtree:500,600,700" rel="stylesheet">
  @vite(['resources/css/app.css', 'resources/js/main.ts'])
</head>
<body class="font-sans antialiased">
  <div id="app"></div>
</body>
</html>
