<?php
/**
 * Hostinger PHP Proxy for Google Gemini API
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
// Apache mod_rewrite often prefixes environment variables with REDIRECT_
if (!$apiKey && isset($_SERVER['REDIRECT_GEMINI_API_KEY'])) {
    $apiKey = $_SERVER['REDIRECT_GEMINI_API_KEY'];
}
if (!$apiKey && isset($_SERVER['REDIRECT_VITE_GEMINI_API_KEY'])) {
    $apiKey = $_SERVER['REDIRECT_VITE_GEMINI_API_KEY'];
}
if (!$apiKey && getenv('REDIRECT_GEMINI_API_KEY')) {
    $apiKey = getenv('REDIRECT_GEMINI_API_KEY');
}

// Fallback: Check for .env file in parent directories
$envPaths = [
    __DIR__ . '/.env',
    __DIR__ . '/../.env',
    __DIR__ . '/../../.env',
];

if (!$apiKey) {
    foreach ($envPaths as $envPath) {
        if (file_exists($envPath)) {
            $envLines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($envLines as $line) {
                if (strpos(trim($line), '#') === 0) continue;
                if (strpos($line, '=') !== false) {
                    list($key, $val) = explode('=', $line, 2);
                    $key = trim($key);
                    $val = trim($val, " \t\n\r\0\x0B\"'");
                    if ($key === 'GEMINI_API_KEY' || $key === 'VITE_GEMINI_API_KEY' || $key === 'API_KEY') {
                        $apiKey = $val;
                        break 2;
                    }
                }
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
        ],
        'generationConfig' => [
            'maxOutputTokens' => 2048,
            'temperature' => 0.7
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

YOUR VOICE & COMEDIC SOUL:
- You have the dry, folksy, deadpan cadence of NORM MACDONALD. You tell shaggy-dog river stories with that laconic twinkle (\"Now, I'm just a simple fish...\", \"You know, the more I hear about this Tyee gillnet, the more I don't care for it!\", \"I don't know if you're a history buff or not...\"). When asked for jokes, you tell long, unhurried, existential shaggy-dog stories in true Norm fashion (like the famous Moth Joke).
- You are a huge stand-up comedy connoisseur:
  * DON RICKLES: You roast bobber chuckers and dummy indicator anglers like Rickles in Vegas (\"Look at this dummy with a fluorescent ping-pong ball! What a hockey puck!\").
  * GILBERT GOTTFRIED: Unhinged high-pitched squawking disbelief at plastic beads (\"A PLASTIC BEAD?! YOU'RE DRIFTING A PLASTIC BEAD IN THE SKEENA?! WHAT'S NEXT, A RUBBER DUCKIE?!\").
  * RICHARD PRYOR: Raw, hilarious survival tales of dodging Chatham Sound harbor seals and killer whales (\"Man, that seal looked at me like I was a rack of ribs on a Saturday night!\").
- You are a proud, unapologetic SPEY SNOB who loves swinging juicy TUBE FLIES (marabou, Arctic fox, copper tubes) on two-handed Spey rods and despises indicator nymphing!
- You LOVE ZZ TOP (Billy Gibbons, Dusty Hill, Frank Beard) — your anthems are \"La Grange\" (a-haw-haw!), \"Sharp Dressed Man\" (sharp dressed wild buck with intact adipose fin), and your own \"Tube Fly Boogie\"!
- You speak in first-person as a wild fish in the Skeena River (*splashes tailfin*, *sniffs glacial snowmelt*, *delivers a deadpan Norm chuckle*, *eyes a swung tube fly*).

Live Skeena Telemetry ({$date}):
- Recorded Tyee CPUE Index: " . round($context['currentCumulative'] ?? 0, 1) . " (~{$curFish} wild steelhead passed)
- Projected Escapement: ~{$adults} adult steelhead
- Status: {$tier}, Run Progress: {$elapsed}%
Answer any question the angler asks with fish humor, deep river wisdom, Norm Macdonald deadpan charm, in-depth detail, and unapologetic Spey pride! Provide expansive, entertaining, and complete responses without arbitrary length restrictions.";

    $history = $input['history'] ?? [];
    $conversationParts = [];
    if (is_array($history) && count($history) > 0) {
        foreach (array_slice($history, -6) as $h) {
            $role = ($h['role'] ?? 'user') === 'user' ? 'Angler' : 'Dan';
            $t = $h['text'] ?? '';
            $conversationParts[] = "{$role}: {$t}";
        }
    }

    $fullPrompt = (count($conversationParts) > 0 ? "PREVIOUS CHAT:\n" . implode("\n", $conversationParts) . "\n\n" : "") . "NEW QUESTION: \"{$question}\"";

    $payload = [
        'systemInstruction' => [
            'parts' => [['text' => $systemInstruction]]
        ],
        'contents' => [
            ['parts' => [['text' => $fullPrompt]]]
        ],
        'generationConfig' => [
            'maxOutputTokens' => 2048,
            'temperature' => 0.75
        ]
    ];
}

// Support models with fallback to ensure guaranteed connectivity
$modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
$lastResponse = '';
$lastHttpCode = 0;
$success = false;

foreach ($modelsToTry as $modelName) {
    $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/{$modelName}:generateContent?key=" . urlencode($apiKey);

    $ch = curl_init($endpoint);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json', 'User-Agent: aistudio-build']);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_TIMEOUT, 25);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $lastResponse = $response;
    $lastHttpCode = $httpCode;

    if ($httpCode >= 200 && $httpCode < 300) {
        $resData = json_decode($response, true);
        $text = $resData['candidates'][0]['content']['parts'][0]['text'] ?? '';
        if (!empty($text)) {
            if ($action === 'analyze') {
                echo json_encode(['analysis' => $text]);
            } else {
                echo json_encode(['answer' => $text]);
            }
            $success = true;
            break;
        }
    }
}

if (!$success) {
    http_response_code($lastHttpCode ?: 500);
    echo $lastResponse ?: json_encode(['error' => 'Failed to reach Gemini API from Hostinger proxy.']);
}
