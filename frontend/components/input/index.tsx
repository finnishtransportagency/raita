const Input = ({ label, ...rest }: Props) => {
  return (
    <div className="block">
      {label && <label className="block">{label}</label>}
      <input
        {...rest}
        className="border border-gray-500 px-4 py-1 w-full block"
      />
    </div>
  );
};

export default Input;

//

export type Props = {
  label?: string;
  type?: 'text' | 'date' | string;
};
