<?php
/**
 * Hostinger PHP DFO Skeena Tyee Test Fishery Scraper & Cron Endpoint
 * Can be pinged every hour via cPanel Cron: curl -s https://yourdomain.com/api/scraper.php
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$cacheFile = __DIR__ . '/tyee_cache.json';
$targetYear = isset($_GET['year']) ? intval($_GET['year']) : 2026;
$dfoParmUrl = 'https://www-ops2.pac.dfo-mpo.gc.ca/fos2_Internet/Testfish/rptDTFDTyeeParm.cfm?fsub_id=585';
$dfoReportUrl = 'https://www-ops2.pac.dfo-mpo.gc.ca/fos2_Internet/Testfish/rptDTFDTyee.cfm';
$directUrl = "https://www-ops2.pac.dfo-mpo.gc.ca/fos2_Internet/Testfish/rptDTFDTyee.cfm?fsub_id=585&year={$targetYear}";

$userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SkeenaTyeeResearch/3.0';

function fetchUrlWithContext($url, $options = []) {
    $context = stream_context_create($options);
    $result = @file_get_contents($url, false, $context);
    return $result;
}

$responseHtml = '';
$scrapeStatus = 'SUCCESS';
$logMessage = '';
$recordsUpdated = 0;
$latestDate = '';
$latestCum = 0.0;

try {
    // 1. Attempt ColdFusion session handshake
    $ch = curl_init($dfoParmUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_USERAGENT, $userAgent);
    curl_setopt($ch, CURLOPT_HEADER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 20);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    $parmOutput = curl_exec($ch);
    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $headers = substr($parmOutput, 0, $headerSize);
    curl_close($ch);

    // Extract cookies
    preg_match_all('/^Set-Cookie:\s*([^;]*)/mi', $headers, $matches);
    $cookies = implode('; ', $matches[1] ?? []);

    // POST to report
    $postData = http_build_query([
        'lboFromMonth' => 'Jun',
        'lboFromDay' => '10',
        'lboToMonth' => 'Dec',
        'lboToDay' => '31',
        'year' => strval($targetYear),
        'lboFsub' => '585',
        'cmdRunReport' => 'Run Report'
    ]);

    $chReport = curl_init($dfoReportUrl);
    curl_setopt($chReport, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($chReport, CURLOPT_POST, true);
    curl_setopt($chReport, CURLOPT_POSTFIELDS, $postData);
    curl_setopt($chReport, CURLOPT_USERAGENT, $userAgent);
    curl_setopt($chReport, CURLOPT_REFERER, $dfoParmUrl);
    curl_setopt($chReport, CURLOPT_COOKIE, $cookies);
    curl_setopt($chReport, CURLOPT_TIMEOUT, 25);
    curl_setopt($chReport, CURLOPT_SSL_VERIFYPEER, false);
    $responseHtml = curl_exec($chReport);
    curl_close($chReport);

    if (!$responseHtml || strlen($responseHtml) < 300) {
        // Fallback to direct URL
        $chDirect = curl_init($directUrl);
        curl_setopt($chDirect, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($chDirect, CURLOPT_USERAGENT, $userAgent);
        curl_setopt($chDirect, CURLOPT_TIMEOUT, 20);
        curl_setopt($chDirect, CURLOPT_SSL_VERIFYPEER, false);
        $responseHtml = curl_exec($chDirect);
        curl_close($chDirect);
    }

    if (!$responseHtml) {
        throw new Exception("Unable to retrieve HTML table from DFO FOS endpoint.");
    }

    // Parse simple table rows
    preg_match_all('/<tr[^>]*>(.*?)<\/tr>/is', $responseHtml, $rowMatches);
    $rows = $rowMatches[1] ?? [];
    $parsedData = [];

    foreach ($rows as $row) {
        preg_match_all('/<td[^>]*>(.*?)<\/td>/is', $row, $cellMatches);
        $cells = array_map(function($c) { return trim(strip_tags($c)); }, $cellMatches[1] ?? []);
        if (count($cells) >= 14) {
            $rawDate = $cells[0];
            $sthdDaily = floatval(preg_replace('/[^0-9.]/', '', $cells[12] ?? '0'));
            $sthdCum = floatval(preg_replace('/[^0-9.]/', '', $cells[13] ?? '0'));

            if (!empty($rawDate) && ($sthdDaily > 0 || $sthdCum > 0)) {
                $parsedData[] = [
                    'date' => $rawDate,
                    'daily' => $sthdDaily,
                    'cumulative' => $sthdCum
                ];
                if ($sthdCum >= $latestCum) {
                    $latestCum = $sthdCum;
                    $latestDate = $rawDate;
                }
            }
        }
    }

    $recordsUpdated = count($parsedData);
    $logMessage = "Scraped DFO: {$recordsUpdated} daily rows extracted. Latest index: {$latestCum} ({$latestDate}).";

    echo json_encode([
        'success' => true,
        'status' => 'SUCCESS',
        'message' => $logMessage,
        'recordsParsed' => $recordsUpdated,
        'latestDate' => $latestDate,
        'latestCumulative' => $latestCum,
        'timestamp' => date('c'),
        'rows' => array_slice($parsedData, -10)
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'status' => 'ERROR',
        'message' => 'Scraper failed: ' . $e->getMessage(),
        'timestamp' => date('c')
    ]);
}
