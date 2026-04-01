import AppTitle from '../components/AppTitle';
import Login from '../components/Login';

const LoginPage = () => {
  return (
    <div id="loginWrapper" className="wrapper">
      <div id="loginContainer" className="container">
        <AppTitle />
        <Login />
      </div>
    </div>
  );
};

export default LoginPage;
