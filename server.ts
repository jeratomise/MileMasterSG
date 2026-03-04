import express from "express";
import { createServer as createViteServer } from "vite";
import cron from "node-cron";
import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client for the backend
// We need the service role key to bypass RLS for the cron job, 
// but if we only have the anon key, we can still try to read if RLS allows.
// Assuming the user has set SUPABASE_URL and SUPABASE_ANON_KEY in their environment.
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

let supabase: any = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

// Setup Nodemailer transporter
// For demonstration, we'll use Ethereal Email if no real SMTP is provided.
let transporter: nodemailer.Transporter;

async function setupMailer() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Generate test SMTP service account from ethereal.email
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log("Using Ethereal Email for testing. Emails will be logged with preview URLs.");
  }
}

// Helper to mask credit card names/numbers
function maskCardName(name: string) {
  // If it contains numbers, mask them except last 4
  const hasNumbers = /\d{4,}/.test(name);
  if (hasNumbers) {
    return name.replace(/\d(?=\d{4})/g, "*");
  }
  return name;
}

// Helper to calculate days remaining
function getDaysRemaining(dueDateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);
  const diffTime = due.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

async function runDailyReminders() {
  console.log("Running daily reminder cron job...");
  if (!supabase) {
    console.log("Supabase credentials not found. Skipping cron job.");
    return;
  }

  try {
    // Fetch all active users
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('*')
      .eq('status', 'active');

    if (usersError) throw usersError;

    for (const user of users || []) {
      // Fetch unpaid bills for this user
      const { data: bills, error: billsError } = await supabase
        .from('bills')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_paid', false);

      if (billsError) {
        console.error(`Error fetching bills for user ${user.id}:`, billsError);
        continue;
      }

      const upcomingBills = (bills || []).filter(b => {
        const daysLeft = getDaysRemaining(b.due_date);
        return daysLeft >= 0 && daysLeft <= 7; // Remind for bills due in the next 7 days
      });

      if (upcomingBills.length > 0) {
        // Construct email text
        let emailText = `Hello ${user.name},\n\nThis is a friendly reminder that you have upcoming credit card bills due soon.\n\n`;
        emailText += `Bank | Card | Amount | Due Date | Days Left\n`;
        emailText += `-----------------------------------------------------------\n`;

        upcomingBills.forEach(b => {
          const maskedCard = maskCardName(b.card_name);
          const amount = `$${b.total_amount.toFixed(2)}`;
          const dueDate = new Date(b.due_date).toLocaleDateString('en-GB');
          const daysLeft = getDaysRemaining(b.due_date);
          emailText += `${b.bank_name} | ${maskedCard} | ${amount} | ${dueDate} | ${daysLeft} days\n`;
        });

        emailText += `\nLog in to CreditTrack to manage your payments.\n\nBest,\nEliteX.CC Team`;

        // Send email
        if (transporter) {
          const info = await transporter.sendMail({
            from: '"CreditTrack" <noreply@elitex.cc>',
            to: user.email,
            subject: "Action Required: Upcoming Credit Card Bills",
            text: emailText,
          });

          console.log(`Reminder sent to ${user.email}`);
          if (info.messageId && nodemailer.getTestMessageUrl(info)) {
            console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
          }
        }
      }
    }
  } catch (err) {
    console.error("Error in cron job:", err);
  }
}

async function startServer() {
  await setupMailer();

  const app = express();
  const PORT = 3000;

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Manual trigger for testing the cron job
  app.post("/api/trigger-reminders", async (req, res) => {
    await runDailyReminders();
    res.json({ success: true, message: "Reminders triggered successfully." });
  });

  // Schedule cron job to run every day at 9:00 AM
  cron.schedule("0 9 * * *", () => {
    runDailyReminders();
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve static files from dist
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
