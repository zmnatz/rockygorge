import { Row, Column } from "antd";
import CardLink from "../components/CardLink";
import StoreItems from "../data/store";

export default function () {
  return (
    <>
      <Row type="flex">
        {StoreItems.map((item) => (
          <CardLink
            key={item.description}
            title={item?.description}
            link={`/${item.name}`}
          >
            {item.info}
          </CardLink>
        ))}
      </Row>
      <Row>
        <CardLink title="Advertise with Us" link="/sponsors">
          Become a jersey sponsor.
        </CardLink>
      </Row>
    </>
  );
}
