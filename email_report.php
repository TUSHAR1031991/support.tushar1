<?php
require 'vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

header('Content-Type: application/json');

// Validate request method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}

// Validate email
$email = filter_var($_POST['email'], FILTER_VALIDATE_EMAIL);
if (!$email) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid email address']);
    exit;
}

// Validate screenshot data
if (empty($_POST['screenshot'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing screenshot data']);
    exit;
}

try {
    // Process screenshot data
    $screenshotData = $_POST['screenshot'];
    if (!preg_match('/^data:image\/png;base64,/', $screenshotData)) {
        throw new Exception('Invalid image data format');
    }
    
    $imageData = base64_decode(str_replace('data:image/png;base64,', '', $screenshotData));
    if (!$imageData) {
        throw new Exception('Failed to decode image data');
    }

    // Create temporary file
    $tempFile = tempnam(sys_get_temp_dir(), 'ticket_report_') . '.png';
    if (!file_put_contents($tempFile, $imageData)) {
        throw new Exception('Failed to save temporary file');
    }

    // Configure PHPMailer
    $mail = new PHPMailer(true);
    
    // Server settings (configure these for your SMTP server)
    $mail->isSMTP();
    $mail->Host = 'smtp.example.com';        // Your SMTP server
    $mail->SMTPAuth = true;
    $mail->Username = 'your_email@example.com'; // SMTP username
    $mail->Password = 'your_password';       // SMTP password
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = 587;
    
    // Recipients
    $mail->setFrom('tickets@yourdomain.com', 'Ticket System');
    $mail->addAddress($email);
    
    // Content
    $mail->isHTML(true);
    $mail->Subject = 'Your Ticket Report - ' . date('Y-m-d');
    $mail->Body = '
        <h2>Ticket Report</h2>
        <p>Please find attached your ticket report as requested.</p>
        <p>This report was generated on ' . date('F j, Y \a\t g:i a') . '</p>
        <p>You can view this report online at any time by visiting the ticket system.</p>
        <p><small>This is an automated message - please do not reply.</small></p>
    ';
    $mail->AltBody = 'Please find attached your ticket report. Generated on ' . date('Y-m-d H:i:s');
    
    // Attach screenshot
    $mail->addAttachment($tempFile, 'ticket_report.png');
    
    // Send email
    if ($mail->send()) {
        echo json_encode(['status' => 'success', 'message' => 'Email sent successfully']);
    } else {
        throw new Exception('Mailer Error: ' . $mail->ErrorInfo);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    
} finally {
    // Clean up temporary file
    if (isset($tempFile) && file_exists($tempFile)) {
        unlink($tempFile);
    }
}
?>