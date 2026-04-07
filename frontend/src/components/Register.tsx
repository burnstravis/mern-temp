import React, { useState } from 'react';
import { buildPath } from "./path.ts";

interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  birthday: string;
  confirmPassword: string;
}

interface RegisterResponse {
  error: string;
}

const Register: React.FC = () => {
  const [formData, setFormData] = useState<RegisterForm>({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    birthday: '',
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

    if(formData.birthday) {
      const birthDay = new Date(formData.birthday);
      if(isNaN(birthDay.getTime())) {
        setError('Please enter a valid date.');
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
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
          password: formData.password,
          birthday: formData.birthday
        })
      });

      const data: RegisterResponse = await response.json();

      if (!response.ok) {
        setError(data.error || 'Registration failed.');
        return;
      }

      setSuccess('Account created! Redirecting...');
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
        birthday: ''
      });

      setTimeout(() => { window.location.href = '/login'; }, 1500);

    } catch {
      setError('Server error. Please try again later.');
    }
  };

  function goBack(): void {
    window.location.href = '/';
  }

  return (
    <div id="registerCard" className="card">
      <p id="registerHeading" className="cardHeading">Create an account</p>
      <p id="registerSubtext" className="cardSubtext">
        Join and start connecting with friends
      </p>

      <div id="registerNameRow" className="fieldRow">
        <div className="fieldGroup">
          <label className="label">First Name</label>
          <input
            type="text"
            name="firstName"
            className="input"
            placeholder="First name"
            value={formData.firstName}
            onChange={handleChange}
          />
        </div>

        <div className="fieldGroup">
          <label className="label">Last Name</label>
          <input
            type="text"
            name="lastName"
            className="input"
            placeholder="Last name"
            value={formData.lastName}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="fieldGroup">
        <label className="label">Email</label>
        <input
          type="email"
          name="email"
          className="input"
          placeholder="Enter your email"
          value={formData.email}
          onChange={handleChange}
        />
      </div>

      <div className="fieldGroup">
        <label className="label">Username</label>
        <input
          type="text"
          name="username"
          className="input"
          placeholder="Choose a username"
          value={formData.username}
          onChange={handleChange}
        />
      </div>

      <div className="fieldGroup">
        <label className="label">Birthday</label>
        <input
            type="text"
            name="birthday"
            className="input"
            placeholder="XX-XX-XXXX"
            value={formData.birthday}
            onChange={handleChange}
        />
      </div>

      <div className="fieldGroup">
        <label className="label">Password</label>
        <input
          type="password"
          name="password"
          className="input"
          placeholder="Choose a password"
          value={formData.password}
          onChange={handleChange}
        />
      </div>

      <div className="fieldGroup">
        <label className="label">Confirm Password</label>
        <input
          type="password"
          name="confirmPassword"
          className="input"
          placeholder="Re-enter your password"
          value={formData.confirmPassword}
          onChange={handleChange}
        />
      </div>

      {error && <p className="errorMsg" style={{ color: 'red' }}>{error}</p>}
      {success && <p className="errorMsg" style={{ color: 'green' }}>{success}</p>}

      <button type="button" className="button" onClick={handleSubmit}>
        Register
      </button>

      <button type="button" className="backButton" onClick={goBack}>
        ← Back
      </button>
    </div>
  );
};

export default Register;