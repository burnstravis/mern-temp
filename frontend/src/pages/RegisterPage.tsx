import AppTitle from '../components/AppTitle';
import Register from '../components/Register';


const RegisterPage = () => {
  return (
    <div id="registerWrapper" className="wrapper">
      <div id="registerContainer" className="container">
        <AppTitle />
        <Register />
      </div>
    </div>
  );
};

export default RegisterPage;
