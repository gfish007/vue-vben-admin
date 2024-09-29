<script setup>
import { computed, ref } from 'vue';

import {
  NCard,
  NInput,
  NModal,
  NSelect,
  NTooltip,
  useThemeVars,
} from 'naive-ui';

const startDate = ref(new Date(2023, 4, 1)); // 从2023年5月1日开始

const rooms = ref([
  { id: 1, name: '标准间', number: '101' },
  { id: 2, name: '标准间', number: '102' },
  { id: 3, name: '大床房', number: '201' },
  { id: 4, name: '大床房', number: '202' },
  { id: 5, name: '套房', number: '301' },
  { id: 6, name: '套房', number: '302' },
  { id: 7, name: '家庭房', number: '401' },
  { id: 8, name: '总统套房', number: '501' },
]);

const bookings = ref([
  {
    endDate: new Date(2023, 4, 7),
    guestName: '张三',
    id: 1,
    roomId: 1,
    startDate: new Date(2023, 4, 5),
  },
  {
    endDate: new Date(2023, 4, 10),
    guestName: '张移',
    id: 2,
    roomId: 1,
    startDate: new Date(2023, 4, 7),
  },
  {
    endDate: new Date(2023, 4, 15),
    guestName: '李四',
    id: 2,
    roomId: 2,
    startDate: new Date(2023, 4, 8),
  },
  {
    endDate: new Date(2023, 4, 18),
    guestName: '王五',
    id: 3,
    roomId: 3,
    startDate: new Date(2023, 4, 12),
  },
  {
    endDate: new Date(2023, 4, 9),
    guestName: '赵六',
    id: 4,
    roomId: 4,
    startDate: new Date(2023, 4, 7),
  },
  {
    endDate: new Date(2023, 4, 20),
    guestName: '钱七',
    id: 5,
    roomId: 5,
    startDate: new Date(2023, 4, 15),
  },
  {
    endDate: new Date(2023, 4, 6),
    guestName: '孙八',
    id: 6,
    roomId: 6,
    startDate: new Date(2023, 4, 3),
  },
  {
    endDate: new Date(2023, 4, 17),
    guestName: '周九',
    id: 7,
    roomId: 7,
    startDate: new Date(2023, 4, 10),
  },
  {
    endDate: new Date(2023, 4, 25),
    guestName: '吴十',
    id: 8,
    roomId: 8,
    startDate: new Date(2023, 4, 20),
  },
  {
    endDate: new Date(2023, 4, 24),
    guestName: '郑十一',
    id: 9,
    roomId: 1,
    startDate: new Date(2023, 4, 22),
  },
  {
    endDate: new Date(2023, 4, 30),
    guestName: '王十二',
    id: 10,
    roomId: 3,
    startDate: new Date(2023, 4, 25),
  },
]);

// 新增方法：处理预订数据并生成日期对象
const processBookings = computed(() => {
  // 创建一个Map来存储每个房间每天的预订信息
  const bookingMap = new Map();
  // 初始化bookingMap
  rooms.value.forEach((room) => {
    visibleDates.value.forEach((date) => {
      const key = `${room.id}-${date.toISOString().split('T')[0]}`;
      bookingMap.set(key, []);
    });
  });

  // 填充bookingMap
  bookings.value.forEach((booking) => {
    const startDate = new Date(booking.startDate);
    const endDate = new Date(booking.endDate);
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const key = `${booking.roomId}-${currentDate.toISOString().split('T')[0]}`;
      if (bookingMap.has(key)) {
        const isStart = currentDate.getTime() === startDate.getTime();
        const isEnd = currentDate.getTime() === endDate.getTime();
        const type = isStart ? 'start' : isEnd ? 'end' : 'full';

        bookingMap.get(key).push({
          ...booking,
          type,
        });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
  });
  return bookingMap;
});

const visibleDates = computed(() => {
  const dates = [];
  for (let i = 0; i < 30; i++) {
    const date = new Date(startDate.value);
    date.setDate(date.getDate() + i);
    dates.push(date);
  }
  return dates;
});

const formatDate = (date) => {
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

const moveBackward = () => {
  startDate.value = new Date(
    startDate.value.getTime() - 15 * 24 * 60 * 60 * 1000,
  );
};

const moveForward = () => {
  startDate.value = new Date(
    startDate.value.getTime() + 15 * 24 * 60 * 60 * 1000,
  );
};

const formatBookingInfo = (booking, room) => {
  if (!booking) return '';
  return `房间: ${room.name} (${room.number})
客人: ${booking.guestName}
入住日期: ${formatFullDate(booking.startDate)}
退房日期: ${formatFullDate(booking.endDate)}`;
};

const showBookingDetails = (room, date) => {
  const bookings = processBookings.value.get(
    `${room.id}-${date.toISOString().split('T')[0]}`,
  );
  if (bookings && bookings.length > 0) {
    selectedBooking.value = {
      ...bookings[0],
      roomName: room.name,
      roomNumber: room.number,
    };
    showModal.value = true;
  }
};

const hideModal = () => {
  showModal.value = false;
  selectedBooking.value = null;
};

const formatFullDate = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}年${month}月${day}日`;
};

const dateRange = computed(() => {
  const start = visibleDates.value[0];
  const end = visibleDates.value[visibleDates.value.length - 1];

  if (start.getFullYear() === end.getFullYear()) {
    return start.getMonth() === end.getMonth()
      ? `${start.getFullYear()}年  ${start.getMonth() + 1}月${start.getDate()}日 - ${end.getDate()}日`
      : `${start.getFullYear()}年  ${start.getMonth() + 1}月${start.getDate()}日 - ${end.getMonth() + 1}月${end.getDate()}日`;
  } else {
    return `${formatFullDate(start)} - ${formatFullDate(end)}`;
  }
});

const showModal = ref(false);
const selectedBooking = ref(null);

const searchQuery = ref('');
const selectedRoomType = ref(null);

const roomTypes = computed(() => {
  return [...new Set(rooms.value.map((room) => room.name))];
});

const filteredRooms = computed(() => {
  return rooms.value.filter((room) => {
    const matchesSearch =
      room.number.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      room.name.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesType =
      !selectedRoomType.value || room.name === selectedRoomType.value;
    return matchesSearch && matchesType;
  });
});

const themeVars = useThemeVars();

const cardStyle = computed(() => {
  return {
    backgroundColor: themeVars.value.cardColor,
    color: themeVars.value.textColor2,
  };
});
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="mb-4 mt-3 flex items-center justify-between">
      <button
        class="rounded bg-blue-500 px-4 py-2 text-white"
        @click="moveBackward"
      >
        前15天
      </button>
      <div class="text-lg font-semibold">
        {{ dateRange }}
      </div>
      <button
        class="rounded bg-blue-500 px-4 py-2 text-white"
        @click="moveForward"
      >
        后15天
      </button>
    </div>
    <div class="flex-grow overflow-hidden">
      <div class="relative h-full overflow-x-auto">
        <table class="w-full border-collapse">
          <thead>
            <tr>
              <th
                class="sticky left-0 z-20 w-[200px] min-w-28 max-w-[200px] border-0 p-0"
              >
                <NCard
                  :bordered="false"
                  :content-style="{ padding: 0 }"
                  :segmented="{ content: true }"
                  :style="cardStyle"
                  class="first-column-card h-full"
                >
                  <div class="flex flex-col space-y-1 p-1">
                    <NInput
                      v-model:value="searchQuery"
                      placeholder="搜索房间"
                      size="tiny"
                    />
                    <NSelect
                      v-model:value="selectedRoomType"
                      :options="
                        roomTypes.map((type) => ({ label: type, value: type }))
                      "
                      clearable
                      placeholder="选择房间类型"
                      size="tiny"
                    />
                  </div>
                </NCard>
              </th>
              <th
                v-for="date in visibleDates"
                :key="date"
                class="w-20 min-w-20 border px-0 py-2"
              >
                {{ formatDate(date) }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="room in filteredRooms" :key="room.id">
              <td
                class="sticky left-0 z-10 w-[200px] min-w-28 max-w-[200px] border-0 p-0"
              >
                <NCard
                  :bordered="false"
                  :content-style="{ padding: 0 }"
                  :segmented="{ content: true }"
                  :style="cardStyle"
                  class="first-column-card h-full"
                >
                  <div class="p-2">{{ room.name }} ({{ room.number }})</div>
                </NCard>
              </td>
              <td
                v-for="date in visibleDates"
                :key="date.toISOString()"
                class="relative h-12 w-20 min-w-20 border-b border-r p-0"
              >
                <NTooltip
                  v-if="
                    processBookings.get(
                      `${room.id}-${date.toISOString().split('T')[0]}`,
                    ).length > 0
                  "
                  :delay="500"
                  placement="top"
                  trigger="hover"
                >
                  <template #trigger>
                    <div class="flex h-full w-full items-center py-1">
                      <div
                        v-for="(booking, index) in processBookings.get(
                          `${room.id}-${date.toISOString().split('T')[0]}`,
                        )"
                        :key="index"
                        :class="{
                          'w-full bg-green-500': booking.type === 'full',
                          'w-1/2 rounded-r-xl bg-green-500':
                            booking.type === 'end',
                          'ml-auto w-1/2 rounded-l-xl bg-green-500':
                            booking.type === 'start',
                        }"
                        class="h-full cursor-pointer"
                        @click="showBookingDetails(room, date)"
                      ></div>
                    </div>
                  </template>
                  <span class="whitespace-pre-line">{{
                    formatBookingInfo(
                      processBookings.get(
                        `${room.id}-${date.toISOString().split('T')[0]}`,
                      )[0],
                      room,
                    )
                  }}</span>
                </NTooltip>
                <div v-else class="h-full w-full"></div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <NModal
      v-model:show="showModal"
      preset="card"
      style="width: 600px"
      title="预订详情"
    >
      <template v-if="selectedBooking">
        <p>
          <strong>房间:</strong> {{ selectedBooking.roomName }} ({{
            selectedBooking.roomNumber
          }})
        </p>
        <p><strong>客人:</strong> {{ selectedBooking.guestName }}</p>
        <p>
          <strong>入住日期:</strong>
          {{ formatFullDate(selectedBooking.startDate) }}
        </p>
        <p>
          <strong>退房日期:</strong>
          {{ formatFullDate(selectedBooking.endDate) }}
        </p>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.n-card {
  height: 100%;
}

.n-card-content {
  height: 100%;
}

.n-card:hover {
  box-shadow:
    0 4px 6px -1px rgb(0 0 0 / 10%),
    0 2px 4px -1px rgb(0 0 0 / 6%);
}
</style>
