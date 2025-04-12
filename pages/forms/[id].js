import forms from "../../data/forms.yml";

export async function getStaticPaths() {
  return {
    paths: forms.map((item) => ({
      params: { id: item.id },
    })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  return { props: forms.find((item) => item?.id === params?.id) };
}

export default function Form({
  formId,
  width,
  height
}) {
  return (
    <iframe src={`https://docs.google.com/forms/d/e/${formId}/viewform?embedded=true`} 
      height={height} 
      width={width}
      frameborder="0"
      marginheight="0" 
      marginwidth="0"
    >
      Loading...
    </iframe>
  );
}
