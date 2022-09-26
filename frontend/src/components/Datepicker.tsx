export function Datepicker(props: Props) {
  const { caption } = props;

  return (
    <div className="input">
      <label className="input__label">{caption}</label>

      <input type={'date'} />
    </div>
  );
}

export default Datepicker;

//

export type Props = {
  caption: string;
};
