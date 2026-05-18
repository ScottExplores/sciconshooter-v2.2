Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$out = Join-Path $root 'public\app-thumbnail.png'
$width = 1200
$height = 628

function New-Color {
  param([int]$R, [int]$G, [int]$B, [int]$A = 255)
  [System.Drawing.Color]::FromArgb($A, $R, $G, $B)
}

function New-RoundedPath {
  param([float]$X, [float]$Y, [float]$Width, [float]$Height, [float]$Radius)

  $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $diameter = $Radius * 2
  $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
  $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
  $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  $path
}

function Draw-RoundedRect {
  param(
    [System.Drawing.Graphics]$Graphics,
    [System.Drawing.RectangleF]$Rect,
    [float]$Radius,
    [System.Drawing.Brush]$Brush,
    [System.Drawing.Pen]$Pen
  )

  $path = New-RoundedPath $Rect.X $Rect.Y $Rect.Width $Rect.Height $Radius
  if ($null -ne $Brush) {
    $Graphics.FillPath($Brush, $path)
  }
  if ($null -ne $Pen) {
    $Graphics.DrawPath($Pen, $path)
  }
  $path.Dispose()
}

function Draw-ImageOpacity {
  param(
    [System.Drawing.Graphics]$Graphics,
    [string]$ImagePath,
    [System.Drawing.Rectangle]$Dest,
    [float]$Opacity
  )

  if (!(Test-Path $ImagePath)) {
    return
  }

  $image = [System.Drawing.Image]::FromFile($ImagePath)
  $matrix = [System.Drawing.Imaging.ColorMatrix]::new()
  $matrix.Matrix33 = $Opacity
  $attrs = [System.Drawing.Imaging.ImageAttributes]::new()
  $attrs.SetColorMatrix(
    $matrix,
    [System.Drawing.Imaging.ColorMatrixFlag]::Default,
    [System.Drawing.Imaging.ColorAdjustType]::Bitmap
  )
  $Graphics.DrawImage(
    $image,
    $Dest,
    0,
    0,
    $image.Width,
    $image.Height,
    [System.Drawing.GraphicsUnit]::Pixel,
    $attrs
  )
  $attrs.Dispose()
  $image.Dispose()
}

$bitmap = [System.Drawing.Bitmap]::new($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

$canvasRect = [System.Drawing.Rectangle]::new(0, 0, $width, $height)
$backgroundBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
  $canvasRect,
  (New-Color 3 7 22),
  (New-Color 11 20 52),
  22
)
$graphics.FillRectangle($backgroundBrush, $canvasRect)
$backgroundBrush.Dispose()

Draw-ImageOpacity $graphics (Join-Path $root 'public\game-art\backgrounds\bg-back.png') $canvasRect 0.42
Draw-ImageOpacity $graphics (Join-Path $root 'public\game-art\backgrounds\bg-stars.png') $canvasRect 0.72
Draw-ImageOpacity $graphics (Join-Path $root 'public\game-art\backgrounds\bg-planet.png') ([System.Drawing.Rectangle]::new(320, 258, 520, 520)) 0.45
Draw-ImageOpacity $graphics (Join-Path $root 'public\game-art\backgrounds\parallax-ring-planet.png') ([System.Drawing.Rectangle]::new(832, 54, 330, 220)) 0.34

$glowBrush = [System.Drawing.SolidBrush]::new((New-Color 37 99 235 52))
$graphics.FillEllipse($glowBrush, -130, -170, 650, 650)
$glowBrush.Color = New-Color 34 197 94 38
$graphics.FillEllipse($glowBrush, 790, -110, 560, 560)
$glowBrush.Color = New-Color 124 58 237 42
$graphics.FillEllipse($glowBrush, 370, 360, 560, 360)
$glowBrush.Dispose()

$rng = [System.Random]::new(2949)
for ($i = 0; $i -lt 150; $i++) {
  $starBrush = [System.Drawing.SolidBrush]::new((New-Color 225 245 255 ($rng.Next(40, 150))))
  $x = $rng.Next(0, $width)
  $y = $rng.Next(0, $height)
  $size = $rng.Next(1, 4)
  $graphics.FillEllipse($starBrush, $x, $y, $size, $size)
  $starBrush.Dispose()
}

$streakPen = [System.Drawing.Pen]::new((New-Color 125 211 252 80), 2)
for ($i = 0; $i -lt 24; $i++) {
  $x = $rng.Next(0, $width)
  $y = $rng.Next(0, $height)
  $graphics.DrawLine($streakPen, $x, $y, $x + 54, $y - 18)
}
$streakPen.Dispose()

$panelRect = [System.Drawing.RectangleF]::new(56, 56, 1088, 516)
$panelBrush = [System.Drawing.SolidBrush]::new((New-Color 2 6 18 172))
$panelPen = [System.Drawing.Pen]::new((New-Color 103 232 249 65), 2)
Draw-RoundedRect $graphics $panelRect 34 $panelBrush $panelPen
$panelBrush.Dispose()
$panelPen.Dispose()

$titleFont = [System.Drawing.Font]::new('Arial Black', 58, [System.Drawing.FontStyle]::Italic, [System.Drawing.GraphicsUnit]::Pixel)
$titleBrush = [System.Drawing.SolidBrush]::new((New-Color 241 245 249))
$shadowBrush = [System.Drawing.SolidBrush]::new((New-Color 8 13 28 180))
$graphics.DrawString('SCICON', $titleFont, $shadowBrush, 88, 88)
$graphics.DrawString('SHOOTER', $titleFont, $shadowBrush, 88, 158)
$graphics.DrawString('SCICON', $titleFont, $titleBrush, 84, 84)
$graphics.DrawString('SHOOTER', $titleFont, $titleBrush, 84, 154)

$tagFont = [System.Drawing.Font]::new('Segoe UI Semibold', 24, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$tagBrush = [System.Drawing.SolidBrush]::new((New-Color 186 230 253))
$graphics.DrawString('RSC-powered science arcade on Base', $tagFont, $tagBrush, 90, 252)

$missionFont = [System.Drawing.Font]::new('Segoe UI', 28, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$missionBrush = [System.Drawing.SolidBrush]::new((New-Color 255 255 255))
$graphics.DrawString('Fight bottlenecks.', $missionFont, $missionBrush, 90, 312)
$graphics.DrawString('Fund open science.', $missionFont, $missionBrush, 90, 352)

$pillRect = [System.Drawing.RectangleF]::new(90, 425, 390, 72)
$pillBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
  [System.Drawing.Rectangle]::new(90, 425, 390, 72),
  (New-Color 37 99 235),
  (New-Color 124 58 237),
  0
)
$pillPen = [System.Drawing.Pen]::new((New-Color 191 219 254 105), 2)
Draw-RoundedRect $graphics $pillRect 28 $pillBrush $pillPen
$pillBrush.Dispose()
$pillPen.Dispose()

$pillFont = [System.Drawing.Font]::new('Segoe UI Black', 24, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$graphics.DrawString('START MISSION', $pillFont, $missionBrush, 132, 445)

$screenRect = [System.Drawing.RectangleF]::new(650, 92, 430, 404)
$screenBrush = [System.Drawing.SolidBrush]::new((New-Color 4 10 31 215))
$screenPen = [System.Drawing.Pen]::new((New-Color 56 189 248 125), 3)
Draw-RoundedRect $graphics $screenRect 32 $screenBrush $screenPen
$screenBrush.Dispose()
$screenPen.Dispose()

$gridPen = [System.Drawing.Pen]::new((New-Color 148 163 184 22), 1)
for ($x = 680; $x -lt 1050; $x += 34) {
  $graphics.DrawLine($gridPen, $x, 126, $x, 462)
}
for ($y = 126; $y -lt 462; $y += 34) {
  $graphics.DrawLine($gridPen, 680, $y, 1050, $y)
}
$gridPen.Dispose()

Draw-ImageOpacity $graphics (Join-Path $root 'public\game-art\bosses\final-boss-sentinel.png') ([System.Drawing.Rectangle]::new(904, 134, 118, 118)) 0.95
Draw-ImageOpacity $graphics (Join-Path $root 'public\game-art\enemies\enemy-drone-2.png') ([System.Drawing.Rectangle]::new(790, 144, 68, 68)) 0.95
Draw-ImageOpacity $graphics (Join-Path $root 'public\game-art\enemies\asteroid-3.png') ([System.Drawing.Rectangle]::new(1022, 314, 52, 52)) 0.88
Draw-ImageOpacity $graphics (Join-Path $root 'public\game-art\enemies\swarm-2.png') ([System.Drawing.Rectangle]::new(710, 344, 54, 54)) 0.95

$shipGlowBrush = [System.Drawing.SolidBrush]::new((New-Color 34 211 238 50))
$graphics.FillEllipse($shipGlowBrush, 765, 285, 190, 190)
$shipGlowBrush.Dispose()

$shipPath = [System.Drawing.Drawing2D.GraphicsPath]::new()
$shipPath.AddPolygon(@(
  [System.Drawing.PointF]::new(860, 270),
  [System.Drawing.PointF]::new(930, 432),
  [System.Drawing.PointF]::new(860, 396),
  [System.Drawing.PointF]::new(790, 432)
))
$shipFill = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
  [System.Drawing.Rectangle]::new(790, 270, 140, 170),
  (New-Color 240 249 255),
  (New-Color 59 130 246),
  90
)
$shipPen = [System.Drawing.Pen]::new((New-Color 255 255 255 210), 3)
$graphics.FillPath($shipFill, $shipPath)
$graphics.DrawPath($shipPen, $shipPath)
$shipFill.Dispose()
$shipPen.Dispose()
$shipPath.Dispose()

$flame = [System.Drawing.Drawing2D.GraphicsPath]::new()
$flame.AddPolygon(@(
  [System.Drawing.PointF]::new(838, 410),
  [System.Drawing.PointF]::new(860, 484),
  [System.Drawing.PointF]::new(882, 410)
))
$flameBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
  [System.Drawing.Rectangle]::new(838, 410, 44, 74),
  (New-Color 251 191 36),
  (New-Color 239 68 68),
  90
)
$graphics.FillPath($flameBrush, $flame)
$flameBrush.Dispose()
$flame.Dispose()

$laserPen = [System.Drawing.Pen]::new((New-Color 103 232 249 190), 5)
$laserPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$laserPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
$graphics.DrawLine($laserPen, 835, 260, 805, 178)
$graphics.DrawLine($laserPen, 885, 260, 920, 178)
$laserPen.Dispose()

$hudFont = [System.Drawing.Font]::new('Consolas', 18, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$hudBrush = [System.Drawing.SolidBrush]::new((New-Color 191 219 254))
$chipBrush = [System.Drawing.SolidBrush]::new((New-Color 15 23 42 190))
$chipPen = [System.Drawing.Pen]::new((New-Color 34 197 94 120), 2)
Draw-RoundedRect $graphics ([System.Drawing.RectangleF]::new(680, 112, 168, 46)) 16 $chipBrush $chipPen
$graphics.DrawString('WAVE 03', $hudFont, $hudBrush, 700, 124)
Draw-RoundedRect $graphics ([System.Drawing.RectangleF]::new(890, 430, 154, 42)) 16 $chipBrush $chipPen
$graphics.DrawString('RSC +100', $hudFont, $hudBrush, 908, 440)
$chipBrush.Dispose()
$chipPen.Dispose()
$hudBrush.Dispose()
$hudFont.Dispose()

$smallFont = [System.Drawing.Font]::new('Consolas', 17, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$smallBrush = [System.Drawing.SolidBrush]::new((New-Color 125 211 252 180))
$graphics.DrawString('RSC on Base', $smallFont, $smallBrush, 875, 524)
$graphics.DrawString('sciconshooter.xyz', $smallFont, $smallBrush, 90, 524)

$titleFont.Dispose()
$titleBrush.Dispose()
$shadowBrush.Dispose()
$tagFont.Dispose()
$tagBrush.Dispose()
$missionFont.Dispose()
$missionBrush.Dispose()
$pillFont.Dispose()
$smallFont.Dispose()
$smallBrush.Dispose()

$graphics.Dispose()
$bitmap.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$bitmap.Dispose()

$file = Get-Item $out
$image = [System.Drawing.Image]::FromFile($out)
[PSCustomObject]@{
  Path = $out
  Width = $image.Width
  Height = $image.Height
  Bytes = $file.Length
  MB = [Math]::Round($file.Length / 1MB, 3)
} | ConvertTo-Json
$image.Dispose()
