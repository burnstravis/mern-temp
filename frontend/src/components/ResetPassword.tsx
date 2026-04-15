import React, { useState } from 'react';
import { buildPath } from "./path.ts";
import {useNavigate} from "react-router-dom";

interface ResetPasswordForm {
  email: string;
  verificationCode: string;
  newPassword: string;
  confirmPassword: string;
}

interface ResetPasswordResponse {
  error: string;
}

const ResetPassword: React.FC = () => {

  const navigate = useNavigate();
  const [formData, setFormData] = useState<ResetPasswordForm>({
    email: '',
    verificationCode: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');



  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = (): boolean => {

    if(!formData.verificationCode){
      setError('Please enter valid verification code.');
      return false;
    }
    if(!formData.email) {
      setError('Please enter account email.');
      return false;
    }

    if (!formData.newPassword || !formData.confirmPassword) {
      setError('All fields are required.');
      return false;
    }

    if (formData.newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    const obj = {
        email:formData.email,verificationCode:formData.verificationCode,
        password:formData.newPassword,
        confirmpassword:formData.confirmPassword
    };
    const js = JSON.stringify(obj);

    try {
      const response = await fetch(buildPath('api/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: js
      });

      const data: ResetPasswordResponse = await response.json();

      if (!response.ok) {
        setError(data.error || 'Password reset failed.');
        return;
      }

      setSuccess('Password reset! Redirecting...');
      setFormData({ email: '', verificationCode: '', newPassword: '', confirmPassword: '' });


      setTimeout(() => { navigate('/login'); }, 1500); //remove this when we reset-password api

    } catch {
      setError('Server error. Please try again later.');
    }
  };

  function goBack(): void {
    navigate('/login');
  }

  return (
    <div id="resetPasswordCard" className="card">
      <p id="resetPasswordHeading" className="cardHeading">Reset your password</p>
      <p id="resetPasswordSubtext" className="cardSubtext">
        Choose a new password for your account
      </p>

      <div className="fieldGroup">
        <label className="label">Account Email</label>
        <input
            type="text"
            name="email"
            className="input"
            placeholder="Account email"
            value={formData.email}
            onChange={handleChange}
        />
        <label className="label">Verification Code</label>
        <input
            type="text"
            name="verificationCode"
            className="input"
            placeholder="Verification Code From Email"
            value={formData.verificationCode}
            onChange={handleChange}
        />
        <label className="label">New Password</label>
        <input
          type="password"
          name="newPassword"
          className="input"
          placeholder="Choose a new password"
          value={formData.newPassword}
          onChange={handleChange}
        />
      </div>

      <div className="fieldGroup">
        <label className="label">Confirm Password</label>
        <input
          type="password"
          name="confirmPassword"
          className="input"
          placeholder="Re-enter your new password"
          value={formData.confirmPassword}
          onChange={handleChange}
        />
      </div>

      {error && <p className="errorMsg" style={{ color: 'red' }}>{error}</p>}
      {success && <p className="errorMsg" style={{ color: 'green' }}>{success}</p>}

      <button type="button" className="button" onClick={handleSubmit}>
        Reset Password
      </button>

      <button type="button" className="backButton" onClick={goBack}>
        ← Back to Login
      </button>
    </div>
  );
};

export default ResetPassword;
