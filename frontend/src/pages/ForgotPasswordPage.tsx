import AppTitle from '../components/AppTitle';
import ForgotPassword from '../components/ForgotPassword.tsx';


const ForgotPasswordPage = () => {
  return (
    <div id="loginWrapper" className="wrapper">
      <div id="loginContainer" className="container">
        <AppTitle />
        <ForgotPassword />
      </div>
    </div>
  );
};

export default ForgotPasswordPage;