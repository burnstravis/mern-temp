import React, { useState } from 'react';
import { buildPath } from './path';

// Struct
interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

// Initialize
const Register: React.FC = () => {
  const [formData, setFormData] = useState<RegisterForm>({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });

  const [verificationCode, setVerificationCode] = useState<string>('');
  const [step, setStep] = useState<'register' | 'verify'>('register');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.firstName || !formData.lastName || !formData.email ||
        !formData.username || !formData.password || !formData.confirmPassword) {
      setError('All fields are required.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address.');
      return false;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }

    return true;
  };

  const handleRegisterSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    try {
      const response = await fetch(buildPath('api/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          username: formData.username,
          password: formData.password
        })
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      setSuccess('A verification code has been sent to ' + formData.email);
      setStep('verify');
    } catch (err) {
      setError('Server error. Please try again later.');
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!verificationCode.trim()) {
      setError('Please enter your verification code.');
      return;
    }

    try {
      const response = await fetch(buildPath('api/verify-email'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          code: verificationCode
        })
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      setSuccess('Email verified! Your account is ready. You can now log in.');
      setStep('register');
      setFormData({
        firstName: '', lastName: '', email: '',
        username: '', password: '', confirmPassword: ''
      });
      setVerificationCode('');
    } catch (err) {
      setError('Server error. Please try again later.');
    }
  };

  if (step === 'verify') {
    return (
      <div id="registerDiv">
        <span id="inner-title">VERIFY YOUR EMAIL</span><br />
        <p>Enter the 6-digit code sent to <strong>{formData.email}</strong>.</p>
        <form onSubmit={handleVerifySubmit}>
          <div>
            Verification Code:&nbsp;
            <input
              type="text"
              id="verificationCode"
              value={verificationCode}
              onChange={e => setVerificationCode(e.target.value)}
              placeholder="Enter 6-digit code"
              maxLength={6}
            />
          </div>

          {error && <span id="registerResult" style={{ color: 'red' }}>{error}</span>}
          {success && <span id="registerResult" style={{ color: 'green' }}>{success}</span>}
          <br />

          <input type="submit" className="buttons" value="Verify" />
          &nbsp;
          <button type="button" onClick={() => { setStep('register'); setError(''); setSuccess(''); }}>
            Back
          </button>
        </form>
      </div>
    );
  }

  return (
    <div id="registerDiv">
      <span id="inner-title">CREATE AN ACCOUNT</span><br />
      <form onSubmit={handleRegisterSubmit}>

        First Name:&nbsp;
        <input
          type="text"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          placeholder="First name"
        /><br />

        Last Name:&nbsp;
        <input
          type="text"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          placeholder="Last name"
        /><br />

        Email:&nbsp;
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email address"
        /><br />

        Username:&nbsp;
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          placeholder="Username"
        /><br />

        Password:&nbsp;
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Password (min 8 chars)"
        /><br />

        Confirm Password:&nbsp;
        <input
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Confirm password"
        /><br />

        {error && <span id="registerResult" style={{ color: 'red' }}>{error}</span>}
        {success && <span id="registerResult" style={{ color: 'green' }}>{success}</span>}
        <br />

        <input type="submit" className="buttons" value="Register" />
        <span>&nbsp;Already have an account? <a href="/">Log in</a></span>

      </form>
    </div>
  );
};

export default Register;
