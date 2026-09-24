import { useState, forwardRef } from "react";
import { Eye, EyeOff } from "lucide-react";
import InputField from "./InputField";

const PasswordField = forwardRef(function PasswordField(
  {
    name = "password",
    label = "Password",
    placeholder = "Enter password",
    endAdornment: customEndAdornment,
    ...props
  },
  ref,
) {
  const [showPassword, setShowPassword] = useState(false);

  const toggleButton = (
    <button
      type="button"
      className="inline-flex items-center justify-center px-2.5 h-8 bg-transparent border-none text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
      onClick={() => setShowPassword((prev) => !prev)}
      aria-label={showPassword ? "Hide password" : "Show password"}
      tabIndex={-1}
    >
      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );

  return (
    <InputField
      ref={ref}
      name={name}
      label={label}
      type={showPassword ? "text" : "password"}
      placeholder={placeholder}
      endAdornment={customEndAdornment || toggleButton}
      {...props}
    />
  );
});

export default PasswordField;
