// LandingPage.tsx
import './LandingPage.css';

const LandingPage = () => {
    function goToLogin(): void {
        window.location.href = '/login';
    }

    function goToRegister(): void {
        window.location.href = '/register';
    }

    return (
        <div id="landingWrapper">
            <div id="landingContainer">
                <h1 id="landingTitle">Friend Connector</h1>
                <p id="landingSubtitle">Staying connected, made simple</p>

                <div className="landingCard">
                    <p className="cardHeading">Have an account?</p>
                    <p className="cardSubtext">Welcome back—your friends are waiting</p>
                    <button
                        type="button"
                        className="landingButton"
                        onClick={goToLogin}
                    >
                        Login
                    </button>
                </div>

                <div className="landingCard">
                    <p className="cardHeading">New here?</p>
                    <p className="cardSubtext">Create an account, start connecting</p>
                    <button
                        type="button"
                        className="landingButton"
                        onClick={goToRegister}
                    >
                        Register
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
