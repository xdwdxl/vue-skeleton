<template>
  <div class="dashboard-wrapper">
    <el-row
      :gutter="20"
      class="dashboard-header"
    >
      <el-col :span="24">
        <div class="header-content">
          <h1 class="dashboard-title">Dashboard</h1>
          <div class="header-controls">
            <PortalDatePicker
              v-model="dateRange"
              type="daterange"
              start-placeholder="Start Date"
              end-placeholder="End Date"
              @change="handleDateChange"
            />
            <PortalButton
              type="form"
              color="primary"
              @click="handleRefresh"
            >
              <el-icon><Refresh /></el-icon>
              Refresh
            </PortalButton>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row
      :gutter="20"
      class="main-content"
    >
      <!-- Sidebar with Tree Navigation -->
      <el-col
        :span="5"
        class="sidebar-wrapper"
      >
        <PortalCard
          style="height: 1180px"
          title="Categories"
          :showFooter="false"
          class="sidebar-card"
        >
          <PortalTree
            :show-checkbox="true"
            :data="categoryData"
            :default-expand-all="true"
            @node-click="handleCategoryClick"
            :node-key="'id'"
            :label-key="'label'"
            :children-key="'children'"
          />
        </PortalCard>
      </el-col>

      <!-- Main Content Area -->
      <el-col :span="19">
        <el-row
          :gutter="20"
          class="stats-row"
        >
          <!-- Statistics Cards -->
          <el-col :span="6">
            <PortalCard
              title="Total Users"
              :showFooter="false"
              class="stat-card"
            >
              <div class="stat-content">
                <div class="stat-number">12,458</div>
                <div class="stat-change positive">
                  <el-icon><ArrowUp /></el-icon>
                  <span>+12.5%</span>
                </div>
              </div>
            </PortalCard>
          </el-col>

          <el-col :span="6">
            <PortalCard
              title="Revenue"
              :showFooter="false"
              class="stat-card"
            >
              <div class="stat-content">
                <div class="stat-number">$48,320</div>
                <div class="stat-change positive">
                  <el-icon><ArrowUp /></el-icon>
                  <span>+8.2%</span>
                </div>
              </div>
            </PortalCard>
          </el-col>

          <el-col :span="6">
            <PortalCard
              title="Orders"
              :showFooter="false"
              class="stat-card"
            >
              <div class="stat-content">
                <div class="stat-number">3,421</div>
                <div class="stat-change negative">
                  <el-icon><ArrowDown /></el-icon>
                  <span>-2.3%</span>
                </div>
              </div>
            </PortalCard>
          </el-col>

          <el-col :span="6">
            <PortalCard
              title="Growth Rate"
              :showFooter="false"
              class="stat-card"
            >
              <div class="stat-content">
                <div class="stat-number">24.5%</div>
                <div class="stat-change positive">
                  <el-icon><ArrowUp /></el-icon>
                  <span>+5.1%</span>
                </div>
              </div>
            </PortalCard>
          </el-col>
        </el-row>

        <el-row
          :gutter="20"
          class="content-row"
        >
          <!-- Charts/Visualization Section -->
          <el-col :span="12">
            <PortalCard
              title="Performance Metrics"
              :showFooter="false"
              class="chart-card"
            >
              <div class="chart-placeholder">
                <div class="progress-item">
                  <div class="progress-label">
                    <span>Website Traffic</span>
                    <span class="progress-value">78%</span>
                  </div>
                  <el-progress :percentage="78" />
                </div>
                <div class="progress-item">
                  <div class="progress-label">
                    <span>User Engagement</span>
                    <span class="progress-value">65%</span>
                  </div>
                  <el-progress
                    :percentage="65"
                    color="#85CE61"
                  />
                </div>
                <div class="progress-item">
                  <div class="progress-label">
                    <span>Conversion Rate</span>
                    <span class="progress-value">45%</span>
                  </div>
                  <el-progress
                    :percentage="45"
                    color="#E6A23C"
                  />
                </div>
                <div class="progress-item">
                  <div class="progress-label">
                    <span>System Health</span>
                    <span class="progress-value">92%</span>
                  </div>
                  <el-progress
                    :percentage="92"
                    color="#909399"
                  />
                </div>
              </div>
            </PortalCard>
          </el-col>

          <!-- Recent Activity Section -->
          <el-col :span="12">
            <PortalCard
              title="Recent Activities"
              :showFooter="false"
              class="activity-card"
            >
              <el-timeline>
                <el-timeline-item
                  v-for="(activity, index) in recentActivities"
                  :key="index"
                  :timestamp="activity.time"
                  placement="top"
                >
                  <p>
                    <strong>{{ activity.title }}</strong>
                  </p>
                  <p>{{ activity.description }}</p>
                </el-timeline-item>
              </el-timeline>
            </PortalCard>
          </el-col>
        </el-row>

        <el-row
          :gutter="20"
          class="table-row"
        >
          <!-- Data Table -->
          <el-col :span="24">
            <PortalCard
              title="User Data"
              :showAdd="true"
              :showEdit="true"
              :showDelete="true"
              :showView="true"
              buttonType="actions"
              @add="handleAdd"
              @edit="handleEdit"
              @delete="handleDelete"
              @view="handleView"
            >
              <PortalTable
                :data="tableData"
                :columns="tableColumns"
                stripe
                :default-sort="{ prop: 'date', order: 'descending' }"
              />
            </PortalCard>
          </el-col>
        </el-row>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
  import { ref, reactive } from 'vue'
  import { ElMessage } from 'element-plus'
  import { Refresh, ArrowUp, ArrowDown } from '@element-plus/icons-vue'
  import PortalCard from '@/components/PortalCard.vue'
  import PortalTree from '@/components/PortalTree.vue'
  import PortalDatePicker from '@/components/PortalDatePicker.vue'
  import PortalTable from '@/components/PortalTable.vue'
  import PortalButton from '@/components/PortalButton.vue'

  // Date range
  const dateRange = ref(null)

  // Category tree data
  const categoryData = ref([
    {
      id: '1',
      label: 'Sales',
      children: [
        { id: '1-1', label: 'Revenue Analysis' },
        { id: '1-2', label: 'Product Sales' },
        { id: '1-3', label: 'Regional Sales' },
      ],
    },
    {
      id: '2',
      label: 'Users',
      children: [
        { id: '2-1', label: 'User Growth' },
        { id: '2-2', label: 'Active Users' },
        { id: '2-3', label: 'User Retention' },
      ],
    },
    {
      id: '3',
      label: 'Operations',
      children: [
        { id: '3-1', label: 'System Performance' },
        { id: '3-2', label: 'Error Tracking' },
        { id: '3-3', label: 'Database Status' },
      ],
    },
    {
      id: '4',
      label: 'Reports',
      children: [
        { id: '4-1', label: 'Daily Report' },
        { id: '4-2', label: 'Weekly Report' },
        { id: '4-3', label: 'Monthly Report' },
      ],
    },
  ])

  // Recent activities
  const recentActivities = ref([
    {
      time: '2024-03-20 14:30',
      title: 'New User Registration',
      description: 'Sarah signed up for the premium plan',
    },
    {
      time: '2024-03-20 13:15',
      title: 'System Update',
      description: 'Database migration completed successfully',
    },
    {
      time: '2024-03-20 12:00',
      title: 'Report Generated',
      description: 'Monthly performance report has been created',
    },
    {
      time: '2024-03-20 11:45',
      title: 'Payment Processed',
      description: 'Invoice #2024-001 has been paid',
    },
    {
      time: '2024-03-20 10:20',
      title: 'Security Alert',
      description: 'Multiple failed login attempts detected and blocked',
    },
  ])

  // Table data
  const tableData = ref([
    {
      date: '2024-03-20',
      username: 'John Doe',
      email: 'john@example.com',
      department: 'Sales',
      status: 'Active',
    },
    {
      date: '2024-03-19',
      username: 'Jane Smith',
      email: 'jane@example.com',
      department: 'Engineering',
      status: 'Active',
    },
    {
      date: '2024-03-18',
      username: 'Mike Johnson',
      email: 'mike@example.com',
      department: 'Marketing',
      status: 'Inactive',
    },
    {
      date: '2024-03-17',
      username: 'Sarah Williams',
      email: 'sarah@example.com',
      department: 'HR',
      status: 'Active',
    },
    {
      date: '2024-03-16',
      username: 'Tom Brown',
      email: 'tom@example.com',
      department: 'Finance',
      status: 'Active',
    },
  ])

  // Table columns
  const tableColumns = ref([
    { prop: 'date', label: 'Date', width: 100 },
    { prop: 'username', label: 'Username', width: 120 },
    { prop: 'email', label: 'Email' },
    { prop: 'department', label: 'Department', width: 100 },
    { prop: 'status', label: 'Status', width: 80 },
  ])

  // Event handlers
  const handleDateChange = (value) => {
    if (value) {
      ElMessage.success(`Date range selected: ${value[0]} to ${value[1]}`)
    }
  }

  const handleRefresh = () => {
    ElMessage.info('Data refreshed')
  }

  const handleCategoryClick = (data) => {
    ElMessage.info(`Selected: ${data.label}`)
  }

  const handleAdd = () => {
    ElMessage.info('Add new record')
  }

  const handleEdit = () => {
    ElMessage.info('Edit selected record')
  }

  const handleDelete = () => {
    ElMessage.warning('Delete selected record')
  }

  const handleView = () => {
    ElMessage.info('View record details')
  }
</script>

<style lang="scss" scoped>
  .dashboard-wrapper {
    width: 100%;
    height: 100%;
    padding: 24px;
    background: #f0f2f5;
    overflow-y: auto;

    .dashboard-header {
      margin-bottom: 24px;

      .header-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: white;
        padding: 24px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

        .dashboard-title {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
        }

        .header-controls {
          display: flex;
          gap: 16px;
          align-items: center;

          :deep(.portal-button-container) {
            button {
              border-radius: 6px;
            }
          }
        }
      }
    }

    .main-content {
      .sidebar-wrapper {
        .sidebar-card {
          position: sticky;
          top: 24px;

          :deep(.el-card__header) {
            padding: 16px;
            border-bottom: 1px solid #e5e7eb;
          }

          :deep(.el-card__body) {
            height: 100%;
            padding: 16px;
          }
        }

        :deep(.portal-card-container) {
          height: fit-content;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
        }

        :deep(.el-tree) {
          background: transparent;
          border: none;

          .el-tree-node__content {
            height: 36px;

            &:hover {
              background: #f3f4f6;
            }
          }
        }
      }

      .stats-row {
        margin-bottom: 24px;

        .stat-card {
          :deep(.el-card__header) {
            padding: 16px;
            border-bottom: 1px solid #e5e7eb;
          }

          :deep(.el-card__body) {
            padding: 20px 16px;
            min-height: 120px;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }

          :deep(.portal-card-container) {
            height: 100%;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
            transition: all 0.3s ease;

            &:hover {
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
          }

          .stat-content {
            padding: 0;

            .stat-number {
              font-size: 36px;
              font-weight: 700;
              color: #1f2937;
              margin-bottom: 12px;
              letter-spacing: -0.5px;
            }

            .stat-change {
              display: flex;
              align-items: center;
              gap: 6px;
              font-size: 14px;
              font-weight: 600;

              i {
                font-size: 16px;
              }

              &.positive {
                color: #10b981;
              }

              &.negative {
                color: #ef4444;
              }
            }
          }
        }
      }

      .content-row {
        margin-bottom: 24px;

        .chart-card,
        .activity-card {
          :deep(.el-card__header) {
            padding: 16px;
            border-bottom: 1px solid #e5e7eb;
          }

          :deep(.el-card__body) {
            padding: 20px 16px;
          }

          :deep(.portal-card-container) {
            height: 100%;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
            transition: all 0.3s ease;

            &:hover {
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
          }
        }

        .chart-placeholder {
          height: 401px;
          padding: 0;

          .progress-item {
            margin-bottom: 24px;

            &:last-child {
              margin-bottom: 0;
            }

            .progress-label {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 10px;
              font-size: 14px;
              color: #4b5563;
              font-weight: 500;

              .progress-value {
                font-weight: 700;
                color: #1f2937;
                min-width: 40px;
                text-align: right;
              }
            }

            :deep(.el-progress) {
              line-height: 4px;
            }
          }
        }

        :deep(.el-timeline) {
          padding: 0;
          max-height: 400px;
          overflow-y: auto;

          &::-webkit-scrollbar {
            width: 6px;
          }

          &::-webkit-scrollbar-track {
            background: transparent;
          }

          &::-webkit-scrollbar-thumb {
            background: #d1d5db;
            border-radius: 3px;

            &:hover {
              background: #9ca3af;
            }
          }

          .el-timeline-item {
            padding-bottom: 16px;

            &:last-child {
              padding-bottom: 0;
            }

            p {
              margin: 6px 0;
              line-height: 1.5;

              &:first-child {
                margin-top: 0;
              }

              &:last-child {
                margin-bottom: 0;
              }

              strong {
                color: #1f2937;
                font-weight: 600;
              }
            }
          }

          :deep(.el-timeline-item__wrapper) {
            padding: 0;
          }

          :deep(.el-timeline-item__timestamp) {
            color: #9ca3af;
            font-size: 12px;
            margin-bottom: 8px;
          }
        }
      }

      .table-row {
        :deep(.el-card__header) {
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
        }

        :deep(.el-card__body) {
          padding: 16px;
        }

        :deep(.portal-card-container) {
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
        }

        :deep(.portal-table) {
          --el-table-border-color: #e5e7eb;
          --el-fill-color-blank: #f9fafb;

          th.el-table__cell {
            background: #f3f4f6;
            font-weight: 600;
            color: #374151;
          }

          tbody tr:hover > td {
            background: #f9fafb;
          }
        }
      }
    }
  }

  @media (max-width: 1200px) {
    .dashboard-wrapper {
      padding: 16px;

      .dashboard-header {
        margin-bottom: 16px;

        .header-content {
          padding: 16px;
          flex-direction: column;
          gap: 16px;
          text-align: center;

          .dashboard-title {
            font-size: 24px;
          }
        }
      }

      .main-content {
        .sidebar-wrapper {
          display: none;
        }
      }
    }
  }

  @media (max-width: 768px) {
    .dashboard-wrapper {
      padding: 12px;

      .dashboard-header {
        margin-bottom: 12px;

        .header-content {
          padding: 12px;

          .dashboard-title {
            font-size: 20px;
          }

          .header-controls {
            gap: 8px;
          }
        }
      }

      .main-content {
        .stats-row {
          margin-bottom: 12px;

          :deep(.el-col) {
            margin-bottom: 12px;

            &:last-child {
              margin-bottom: 0;
            }
          }
        }

        .content-row {
          margin-bottom: 12px;

          :deep(.el-col) {
            margin-bottom: 12px;

            &:last-child {
              margin-bottom: 0;
            }
          }
        }
      }
    }
  }
</style>
