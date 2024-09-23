import { computed, onMounted, onUnmounted, ref } from 'vue';

export const useDynamicHeight = (queryCardRef) => {
  const pageHeight = ref(window.innerHeight);
  const queryCardHeight = ref(0);

  const tableHeight = computed(() => {
    const systemBarHeight = 50;
    const tabBarHeight = 37;
    const bottomHeight = 32;
    const titleCardHeight = 84;
    const cardMargin = 16 * 2 + 20 * 2;
    return (
      pageHeight.value -
      systemBarHeight -
      tabBarHeight -
      bottomHeight -
      titleCardHeight -
      queryCardHeight.value -
      cardMargin * 2
    );
  });

  onMounted(() => {
    if (queryCardRef.value) {
      queryCardHeight.value = queryCardRef.value.offsetHeight;
    }

    const updateHeight = () => {
      pageHeight.value = window.innerHeight;
      if (queryCardRef.value) {
        queryCardHeight.value = queryCardRef.value.offsetHeight;
      }
    };

    window.addEventListener('resize', updateHeight);

    onUnmounted(() => {
      window.removeEventListener('resize', updateHeight);
    });
  });

  return { queryCardHeight, tableHeight };
};
