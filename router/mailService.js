require("dotenv").config(); // Load .env file
const nodemailer = require("nodemailer");

const sendOTP = async (recipientEmail) => {
    try {
        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000);

        // Configure the transporter
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // Email options
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: recipientEmail,
            subject: "Verify your email address for DSA TRAINER",
            html: `<!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta http-equiv="X-UA-Compatible" content="IE=edge">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>{Code King}</title>
                    </head>
                    <body style="margin: 0; padding: 0;">
                        <center style="margin: 5px; padding: 5px;">
                            <div style="padding: 10px;">
                                <h1 font-size: 38px;">
                                <span style="color: rgb(0, 255, 0);">DSA TRAINER</span>
                                </h1>
                            </div>
                            <hr style="width: 40vmax; background-color: rgb(255, 123, 0);">
                            <div style="background-color: rgb(232, 253, 255); height: auto; width: 40vmax; margin-bottom: 5px; padding: 10px;">
                                <h1 style="color: rgb(42, 53, 52);">Verify this email is yours</h1>
                                <p style="color: rgb(103, 132, 240); font-size: larger;">${recipientEmail}</p>
                            </div>
                            <div style="background-color: rgb(232, 253, 255); height: auto; width: 40vmax; padding: 10px;">
                                <p style="font-size: large; color: rgb(42, 53, 52);">
                                    This email address was recently provided for a new 
                                    <a style="color: rgb(255, 123, 0);" href="https://www.dsatrainer.tech">DSA Trainer</a> account.
                                </p>
                                <br><br>
                                <h1 style="font-size: 30px; color: rgb(255, 123, 0);">${otp}</h1>
                                <br><br>
                                <p style="font-size: large; color: rgb(42, 53, 52);">
                                    If this wasn't you, please disregard this email; 
                                    someone may have mistyped their email address.
                                </p>
                                <br>
                                <p style="color: rgb(42, 53, 52); font-size: larger;">
                                    Website - <a style="color: rgb(103, 132, 240);" href="https://www.dsatrainer.tech">DSA Trainer</a>
                                </p>
                            </div>
                            <hr style="width: 40vmax; background-color: rgb(255, 123, 0);">
                        </center>
                    </body>
                    </html>`,
        };


        // Send the email
        await transporter.sendMail(mailOptions);
        console.log(`OTP sent to ${recipientEmail}`);

        return otp; // Return OTP for further processing (e.g., saving to DB)
    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
};

module.exports = sendOTP;
