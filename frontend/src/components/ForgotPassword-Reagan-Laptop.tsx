import styles from '../pages/ForgotPasswordPage.module.css';

function ForgotPassword()
{
    return (
        <div className={styles.forgotPasswordContainer}>
            <h1 className={styles.forgotPassowordTitle}>Forgot Password?</h1>
            <h2 className={styles.forgotPasswordSubTitle}>Enter the email address associated with your account and we will send you a link to reset your password.</h2>
            <div className={styles.inputDiv}>
                <label className={styles.inputLabel}>Email</label>
                <div className="input-container">
                    <input
                        type="text"
                        className={styles.loginField}
                        placeholder="Username"
                        //onChange={handleSetLoginName}
                    />
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;