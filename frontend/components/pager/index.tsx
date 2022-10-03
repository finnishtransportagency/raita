const Pager = ({ pages }: Props) => {
  return (
    <ul className="flex border-2 divide-x-2">
      {pages.map((it, i) => {
        return (
          <li key={`pager-${i}`} className="px-4 py-2">
            {i}
          </li>
        );
      })}
    </ul>
  );
};

export default Pager;

//

export type Props = {
  pages: {}[];
};
