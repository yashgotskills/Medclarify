import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Enhanced disposable email domains list
const DISPOSABLE_DOMAINS = [
  '10minutemail.com', 'guerrillamail.com', 'mailinator.com', 'tempmail.org',
  'temp-mail.org', 'yopmail.com', 'throwaway.email', 'getnada.com',
  'maildrop.cc', '33mail.com', 'trashmail.com', 'dispostable.com',
  'spamgourmet.com', 'sharklasers.com', 'guerrillamailblock.com',
  'pokemail.net', 'spam4.me', 'bccto.me', 'chacuo.net', 'cookmail.info',
  'email60.com', 'emailias.com', 'hide.biz.st', 'mytrashmail.com',
  'shieldedmail.com', 'spamavert.com', 'tempinbox.com', 'tempmailaddress.com',
  'tempymail.com', 'thankyou2010.com', 'trbvm.com', 'wegwerfmail.de',
  'zehnminutenmail.de', 'mohmal.com', 'minuteinbox.com', 'armyspy.com',
  'cuvox.de', 'dayrep.com', 'einrot.com', 'fleckens.hu', 'gustr.com',
  'jourrapide.com', 'rhyta.com', 'superrito.com', 'teleworm.us'
];

const SUSPICIOUS_PATTERNS = [
  /^[a-z]+\d{4,}@/i,  // Simple name + many numbers
  /^test\d*@/i,       // Starts with "test"
  /^fake\d*@/i,       // Starts with "fake"
  /^spam\d*@/i,       // Starts with "spam"
  /^temp\d*@/i,       // Starts with "temp"
  /^demo\d*@/i,       // Starts with "demo"
  /^admin\d*@/i,      // Starts with "admin"
  /^null\d*@/i,       // Starts with "null"
  /^noreply\d*@/i,    // Starts with "noreply"
  /^\d{8,}@/,         // Only numbers (8+ digits)
  /^[a-z]{1,2}@/i,    // Very short usernames
  /^.+\+.+\+.+@/i,    // Multiple + signs
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, action = 'validate' } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return new Response(
        JSON.stringify({ 
          isValid: false, 
          error: 'Invalid email format',
          riskScore: 100 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const domain = normalizedEmail.split('@')[1];
    const username = normalizedEmail.split('@')[0];
    
    let riskScore = 0;
    const errors = [];
    const warnings = [];

    // Check disposable domains
    if (DISPOSABLE_DOMAINS.includes(domain)) {
      return new Response(
        JSON.stringify({ 
          isValid: false, 
          error: 'Disposable email addresses are not allowed. Please use a permanent email address.',
          riskScore: 100 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check suspicious patterns
    for (const pattern of SUSPICIOUS_PATTERNS) {
      if (pattern.test(normalizedEmail)) {
        riskScore += 40;
        warnings.push('Email pattern appears suspicious');
        break;
      }
    }

    // Check for existing user with this email
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const emailExists = existingUser.users.some(user => user.email === normalizedEmail);
    
    if (emailExists && action === 'signup') {
      return new Response(
        JSON.stringify({ 
          isValid: false, 
          error: 'An account with this email already exists',
          riskScore: 0 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Additional risk factors
    if (username.length < 3) {
      riskScore += 20;
      warnings.push('Username is very short');
    }

    if (username.length > 30) {
      riskScore += 15;
      warnings.push('Username is unusually long');
    }

    const numberCount = (normalizedEmail.match(/\d/g) || []).length;
    if (numberCount > username.length * 0.7) {
      riskScore += 20;
      warnings.push('Email contains too many numbers');
    }

    // Check for consecutive special characters
    if (/[.+_-]{3,}/.test(normalizedEmail)) {
      riskScore += 25;
      warnings.push('Email contains suspicious character patterns');
    }

    // Domain validation
    if (!domain.includes('.') || domain.length < 4) {
      riskScore += 30;
      warnings.push('Domain appears invalid');
    }

    // Final validation
    const isValid = riskScore < 60;
    
    if (!isValid) {
      errors.push('Email appears to be fake or suspicious');
    }

    // Log validation attempt for monitoring
    console.log(`Email validation: ${normalizedEmail}, Risk Score: ${riskScore}, Valid: ${isValid}`);

    return new Response(
      JSON.stringify({ 
        isValid,
        email: normalizedEmail,
        riskScore,
        errors,
        warnings,
        domain,
        message: isValid ? 'Email is valid' : 'Email validation failed'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in validate-email function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Email validation service error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});