import React, { useState } from 'react';
import { buildPath } from "./path.ts";

interface ForgotPasswordResponse {
  error: string;
}

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const validateForm = (): boolean => {
    if (!email) {
      setError('Email is required.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    try {
      const response = await fetch(buildPath('api/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data: ForgotPasswordResponse = await response.json();

      if (!response.ok) {
        setError(data.error || 'Something went wrong.');
        return;
      }

      // Always show a generic message so users can't probe for registered emails
      setSuccess('If an account exists, we sent a reset link to that email.');
      setEmail('');

    } catch {
      setError('Server error. Please try again later.');
    }
  };

  function goBack(): void {
    window.location.href = '/login';
  }

  return (
    <div id="forgotPasswordCard" className="card">
      <p id="forgotPasswordHeading" className="cardHeading">Forgot your password?</p>
      <p id="forgotPasswordSubtext" className="cardSubtext">
        Enter the email address associated with your account and we'll send you a reset link.
      </p>

      <div className="fieldGroup">
        <label className="label">Email</label>
        <input
          type="email"
          name="email"
          className="input"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {error && <p className="errorMsg" style={{ color: 'red' }}>{error}</p>}
      {success && <p className="errorMsg" style={{ color: 'green' }}>{success}</p>}

      <button type="button" className="button" onClick={handleSubmit}>
        Send Reset Link
      </button>

      <button type="button" className="backButton" onClick={goBack}>
        ← Back to Login
      </button>
    </div>
  );
};

export default ForgotPassword;