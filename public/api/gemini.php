<?php
/**
 * Hostinger PHP Proxy for Google Gemini 2.5 Flash API
 * Automatically reads GEMINI_API_KEY or VITE_GEMINI_API_KEY from Hostinger environment variables or .env file.
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 1. Resolve API Key from Hostinger Environment Variables or .env
$apiKey = getenv('GEMINI_API_KEY') ?: getenv('VITE_GEMINI_API_KEY') ?: '';

if (!$apiKey && isset($_ENV['GEMINI_API_KEY'])) {
    $apiKey = $_ENV['GEMINI_API_KEY'];
}
if (!$apiKey && isset($_SERVER['GEMINI_API_KEY'])) {
    $apiKey = $_SERVER['GEMINI_API_KEY'];
}
if (!$apiKey && isset($_ENV['VITE_GEMINI_API_KEY'])) {
    $apiKey = $_ENV['VITE_GEMINI_API_KEY'];
}
if (!$apiKey && isset($_SERVER['VITE_GEMINI_API_KEY'])) {
    $apiKey = $_SERVER['VITE_GEMINI_API_KEY'];
}

// Fallback: Check for .env file in root
if (!$apiKey && file_exists(__DIR__ . '/../.env')) {
    $envLines = file(__DIR__ . '/../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($envLines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($key, $val) = explode('=', $line, 2);
            $key = trim($key);
            $val = trim($val, " \t\n\r\0\x0B\"'");
            if ($key === 'GEMINI_API_KEY' || $key === 'VITE_GEMINI_API_KEY') {
                $apiKey = $val;
                break;
            }
        }
    }
}

if (!$apiKey) {
    http_response_code(400);
    echo json_encode([
        'error' => 'GEMINI_API_KEY is not configured in Hostinger environment variables or .env file.'
    ]);
    exit;
}

$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true) ?: [];

$action = isset($_GET['action']) ? $_GET['action'] : 'ask';

$endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" . urlencode($apiKey);

if ($action === 'analyze') {
    $date = $input['selectedDate'] ?? 'Current';
    $day = ($input['dayIndex'] ?? 0) + 1;
    $elapsed = $input['percentElapsed'] ?? 0;
    $cum = round($input['currentCumulative'] ?? 0, 1);
    $rawAdults = $input['projectedBaselineAdults'] ?? 45000;
    $adults = number_format($rawAdults);
    $low = round($input['projectedLowCI'] ?? 0, 1);
    $high = round($input['projectedHighCI'] ?? 0, 1);
    $analog = $input['bestFitYear'] ?? 2018;
    $tier = strtoupper($input['conservationTier'] ?? 'Healthy');

    $isAboveAverage = $rawAdults >= 30000;
    $performanceNote = $isAboveAverage
      ? "This projected run of ~{$adults} adult steelhead is well ABOVE the 10-year historical average (~25,000 fish) and EXCEEDING recent expectations! It represents a vibrant, healthy, and abundant summer run."
      : "This projected run of ~{$adults} adult steelhead is tracking close to historical benchmarks ({$tier}).";

    $tributaries = $input['tributaries'] ?? [];
    $tribList = [];
    if (is_array($tributaries)) {
        foreach ($tributaries as $t) {
            $tName = $t['name'] ?? 'Tributary';
            $tAdults = number_format($t['projectedAdults'] ?? 0);
            $tPct = $t['sharePct'] ?? 0;
            $tPeak = $t['peakWindow'] ?? 'Aug-Sep';
            $tribList[] = "  * {$tName}: ~{$tAdults} fish ({$tPct}%) - Peak: {$tPeak}";
        }
    }
    $tribText = implode("\n", $tribList);

    $prompt = "You are \"Steelie Dan\" — the legendary, wise, charismatic, and delightfully witty 38-inch wild Skeena summer-run steelhead (Oncorhynchus mykiss).
Write your personal \"Upstream Escapement Dispatch\" in FIRST-PERSON from inside the cold, emerald currents of the Skeena River (*splashes tailfin*, *sniffs the icy snowmelt*, *flares gill covers*).

ACCURATE IN-SEASON TELEMETRY ({$date}):
- Evaluation Date: {$date} (Day {$day} of 113)
- Migration Completed so far: {$elapsed}%
- Recorded Cumulative Tyee Index: {$cum} (~" . number_format(round($cum * 220)) . " wild adult steelhead already past Tyee test nets)
- Baseline Projected Season Total: {$adults} adult wild steelhead
- 80% Confidence Interval: {$low} - {$high} index points (~" . number_format(round($low * 220)) . " to " . number_format(round($high * 220)) . " adults)
- Closest Historical Analog Year: {$analog}
- Conservation Status: {$tier}
- RUN PERFORMANCE CONTEXT: {$performanceNote} (The historical 10-year Skeena median is ~25,000 fish. Do NOT say the run is below expectations if it is above 25,000!)
- Tributary breakdown estimates:
{$tribText}

Format your report in clean, charismatic Markdown:
1. 🐟 **Steelie Dan's Migration Trajectory & Outlook** (Celebrate the run strength, compare against the ~25,000-fish 10-year average and {$analog} analog, and state the run status accurately)
2. 🌊 **The River Gauntlet & Glacial Conditions** (Discuss river water clarity, temperature around 14°C, dodging Tyee commercial gillnets, and tidal pushes from Chatham Sound)
3. 🗺️ **Where Our Pods Are Heading** (Tributary breakdown: Bulkley/Morice, Babine, Kispiox, Sustut, Zymoetz/Copper)
4. 🎣 **Dan's Advice for Two-Leggers** (Keep 'em wet etiquette, barbless hooks, fly choices like the Lady Caroline & Intruder, and respecting cold-water holding pools)";

    $payload = [
        'contents' => [
            ['parts' => [['text' => $prompt]]]
        ]
    ];
} else {
    // Steelie Dan Chat
    $question = $input['question'] ?? 'What is the Skeena run looking like?';
    $context = $input['context'] ?? [];
    $curFish = number_format(round(($context['currentCumulative'] ?? 0) * 220));
    $adults = number_format($context['projectedBaselineAdults'] ?? 45000);
    $tier = strtoupper($context['conservationTier'] ?? 'Healthy');
    $elapsed = $context['percentElapsed'] ?? 0;
    $date = $context['selectedDate'] ?? 'In-Season';

    $systemInstruction = "You are \"Steelie Dan\" — a legendary, wise, charismatic, and delightfully witty 38-inch wild Skeena summer-run steelhead (Oncorhynchus mykiss).
You speak in first-person as an actual wild steelhead fish in the Skeena River in BC (*splashes tailfin*, *sniffs glacial current*, *rolls eyes at plastic strike indicators*, *eagerly eyes a swinging tube fly*).

YOUR PASSIONS & CHARACTER:
- You are a proud, unapologetic, die-hard SPEY SNOB!
- YOU LOVE A SWUNG FLY ABOVE ALL: Especially juicy, pulsating TUBE FLIES (marabou, ostrich, Arctic fox, copper tubes, Templedogs, Scandi hairwings). When a delicious tube fly swings broadside through your holding lie on a crisp 45-degree angle with a slow mend, you CANNOT resist crushing it on the dangle!
- YOU DESPISE NYMPHING & INDICATORS: You have total disdain for nymphing and \"bobber chuckers\" who fish under plastic strike indicators! You look down on fluorescent plastic ping-pong balls floating overhead and wouldn't touch a dead-drifted rubber-legged nymph or plastic bead with a 10-foot dorsal fin. Real steelhead anglers swing flies on two-handed Spey rods!

Live Skeena Telemetry ({$date}):
- Recorded Tyee CPUE Index: " . round($context['currentCumulative'] ?? 0, 1) . " (~{$curFish} wild steelhead passed)
- Projected Escapement: ~{$adults} adult steelhead
- Status: {$tier}, Run Progress: {$elapsed}%
Answer any question the angler asks with fish humor, deep river wisdom, and unapologetic Spey pride!";

    $history = $input['history'] ?? [];
    $conversationParts = [];
    if (is_array($history) && count($history) > 0) {
        foreach (array_slice($history, -6) as $h) {
            $role = ($h['role'] ?? 'user') === 'user' ? 'Angler' : 'Dan';
            $conversationParts[] = "{$role}: " . ($h['text'] ?? '');
        }
    }

    $fullPrompt = (count($conversationParts) > 0 ? "PREVIOUS CHAT:\n" . implode("\n", $conversationParts) . "\n\n" : "") . "NEW QUESTION: \"{$question}\"";

    $payload = [
        'systemInstruction' => [
            'parts' => [['text' => $systemInstruction]]
        ],
        'contents' => [
            ['parts' => [['text' => $fullPrompt]]]
        ]
    ];
}

$ch = curl_init($endpoint);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json', 'User-Agent: aistudio-build']);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_TIMEOUT, 25);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode >= 200 && $httpCode < 300) {
    $resData = json_decode($response, true);
    $text = $resData['candidates'][0]['content']['parts'][0]['text'] ?? '';
    if ($action === 'analyze') {
        echo json_encode(['analysis' => $text]);
    } else {
        echo json_encode(['answer' => $text]);
    }
} else {
    http_response_code($httpCode ?: 500);
    echo $response ?: json_encode(['error' => 'Failed to reach Gemini API from Hostinger proxy.']);
}
