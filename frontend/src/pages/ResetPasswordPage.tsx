import AppTitle from '../components/AppTitle';
import ResetPassword from '../components/ResetPassword';

const ResetPasswordPage = () => {
  return (
    <div id="loginWrapper" className="wrapper">
      <div id="loginContainer" className="container">
        <AppTitle />
        <ResetPassword />
      </div>
    </div>
  );
};

export default ResetPasswordPage;