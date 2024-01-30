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
        <CardLink title="Rocky Gorge Plus" link="/plus">
          Monthly rugby access for a low price.
        </CardLink>
        <CardLink title="2024 Banquet" link="/banquet">
          Get your tickets for the Hall of Fame Banquet
        </CardLink>
        <CardLink title="Advertise with Us" link="/sponsors">
          Become a jersey sponsor.
        </CardLink>
      </Row>
    </>
  );
}
