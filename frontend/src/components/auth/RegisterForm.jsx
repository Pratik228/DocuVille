import { useState } from "react";
import { Link } from "react-router-dom";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import axios from "axios";

const RegisterSchema = Yup.object().shape({
  firstName: Yup.string()
    .min(2, "Too Short!")
    .max(50, "Too Long!")
    .required("First name is required"),
  lastName: Yup.string()
    .min(2, "Too Short!")
    .max(50, "Too Long!")
    .required("Last name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Must contain uppercase, lowercase, number and special character"
    )
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password"), null], "Passwords must match")
    .required("Please confirm your password"),
});

const RegisterForm = () => {
  const [verificationLink, setVerificationLink] = useState("");
  const [error, setError] = useState("");
  const [verificationSent, setVerificationSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-8">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          {verificationSent ? (
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Verify Your Email</h2>
              <p className="mb-4">
                Since this is a demo application, you can use this link to
                verify your email:
              </p>
              {verificationLink && (
                <div className="bg-base-200 p-4 rounded-lg mb-4 overflow-x-auto">
                  <a
                    href={verificationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link link-primary text-sm break-all"
                    onClick={async (e) => {
                      e.preventDefault();
                      try {
                        // Open the verification URL in a new tab
                        window.open(verificationLink, "_blank");
                        toast.info(
                          "Check the verification result in the new tab"
                        );
                      } catch (err) {
                        toast.error(
                          "Verification failed. Please try again.",
                          err
                        );
                      }
                    }}
                  >
                    {verificationLink}
                  </a>
                </div>
              )}
              <p className="text-sm text-gray-500 mb-4">
                In a production environment, this link would be sent to your
                email.
                <br />
                This link will expire in 24 hours.
              </p>
              <div className="mt-6 flex gap-2 justify-center">
                {verificationLink && (
                  <button
                    onClick={() => window.open(verificationLink, "_blank")}
                    className="btn btn-secondary"
                  >
                    Open Verification Email
                  </button>
                )}
                <Link to="/login" className="btn btn-primary">
                  Go to Login
                </Link>
              </div>
            </div>
          ) : (
            <>
              <h2 className="card-title justify-center text-2xl mb-4">
                Create Account
              </h2>

              <Formik
                initialValues={{
                  firstName: "",
                  lastName: "",
                  email: "",
                  password: "",
                  confirmPassword: "",
                }}
                validationSchema={RegisterSchema}
                onSubmit={async (values, { setSubmitting }) => {
                  try {
                    setIsLoading(true);
                    const response = await axios.post(
                      `${import.meta.env.VITE_API_URL}/api/auth/register`,
                      values
                    );
                    setVerificationSent(true);
                    setVerificationLink(response.data.previewUrl);
                    toast.success(
                      "Registration successful! Use the verification link below."
                    );
                  } catch (err) {
                    setError(
                      err.response?.data?.message || "Registration failed"
                    );
                    toast.error(
                      err.response?.data?.message || "Registration failed"
                    );
                  } finally {
                    setIsLoading(false);
                    setSubmitting(false);
                  }
                }}
              >
                {({ errors, touched }) => (
                  <Form className="space-y-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">First Name</span>
                      </label>
                      <Field
                        name="firstName"
                        placeholder="John"
                        className={`input input-bordered ${
                          errors.firstName && touched.firstName
                            ? "input-error"
                            : ""
                        }`}
                      />
                      {errors.firstName && touched.firstName && (
                        <label className="label">
                          <span className="label-text-alt text-error">
                            {errors.firstName}
                          </span>
                        </label>
                      )}
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Last Name</span>
                      </label>
                      <Field
                        name="lastName"
                        placeholder="Doe"
                        className={`input input-bordered ${
                          errors.lastName && touched.lastName
                            ? "input-error"
                            : ""
                        }`}
                      />
                      {errors.lastName && touched.lastName && (
                        <label className="label">
                          <span className="label-text-alt text-error">
                            {errors.lastName}
                          </span>
                        </label>
                      )}
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Email</span>
                      </label>
                      <Field
                        name="email"
                        type="email"
                        placeholder="example@email.com"
                        className={`input input-bordered ${
                          errors.email && touched.email ? "input-error" : ""
                        }`}
                      />
                      {errors.email && touched.email && (
                        <label className="label">
                          <span className="label-text-alt text-error">
                            {errors.email}
                          </span>
                        </label>
                      )}
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Password</span>
                      </label>
                      <Field
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        className={`input input-bordered ${
                          errors.password && touched.password
                            ? "input-error"
                            : ""
                        }`}
                      />
                      {errors.password && touched.password && (
                        <label className="label">
                          <span className="label-text-alt text-error">
                            {errors.password}
                          </span>
                        </label>
                      )}
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Confirm Password</span>
                      </label>
                      <Field
                        name="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        className={`input input-bordered ${
                          errors.confirmPassword && touched.confirmPassword
                            ? "input-error"
                            : ""
                        }`}
                      />
                      {errors.confirmPassword && touched.confirmPassword && (
                        <label className="label">
                          <span className="label-text-alt text-error">
                            {errors.confirmPassword}
                          </span>
                        </label>
                      )}
                    </div>

                    {error && (
                      <div className="alert alert-error text-sm">{error}</div>
                    )}

                    <button
                      type="submit"
                      className={`btn btn-primary w-full ${
                        isLoading ? "loading" : ""
                      }`}
                      disabled={isLoading}
                    >
                      Register
                    </button>

                    <div className="text-center mt-4">
                      <Link to="/login" className="link link-primary">
                        Already have an account? Login
                      </Link>
                    </div>
                  </Form>
                )}
              </Formik>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
