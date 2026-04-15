import React, { useState } from 'react';
import { buildPath } from "./path.ts";
import {useNavigate} from "react-router-dom";

interface ForgotPasswordResponse {
  error: string;
}

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const navigate = useNavigate();

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

    const obj = {email: email};
    const js = JSON.stringify(obj);

    try {
      const response = await fetch(buildPath('api/email-recovery'), {
        method: 'POST',
        body: js,
        headers: { 'Content-Type': 'application/json' }
      });

      const data: ForgotPasswordResponse = await response.json();

      if (!response.ok) {
        setError(data.error || 'Something went wrong.');
        return;
      }

      // Always show a generic message so users can't probe for registered emails
      setSuccess('If an account exists, we sent a reset link to that email.');

      setTimeout(() => { navigate('/resetPassword'); }, 1500);
      setEmail('');

    } catch {
      setError('Server error. Please try again later.');
    }
  };

  function goBack(): void {
    navigate('/login');
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