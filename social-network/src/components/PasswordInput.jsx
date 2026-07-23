"use client";
import { useState } from "react";

const PasswordInput = ({
  value,
  onChange,
  placeholder = "password",
  className = "",
}) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative w-full">
      <input
        className={"w-full rounded border p-2 pr-10 " + className}
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "hide password" : "show password"}
        className="absolute inset-y-0 right-0 flex items-center px-3"
      >
        <img
          src={visible ? "/eye-off.svg" : "/eye.svg"}
          alt=""
          width={20}
          height={20}
        />
      </button>
    </div>
  );
};

export default PasswordInput;
