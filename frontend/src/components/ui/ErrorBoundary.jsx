import { Component } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";

/** يعزل انهيار جزء من الشاشة ويُبقي بقية لوحة الإدارة قابلة للاستخدام. */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // لا نخفي الخطأ: يبقى ظاهراً في أدوات المطور مع واجهة استرداد للمستخدم.
    console.error("Request details rendering failed", error, info);
  }

  retry = () => {
    this.setState({ error: null });
    this.props.onRetry?.();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="p-5">
        <Alert tone="danger" title="تعذّر عرض تفاصيل الطلب">
          حدث خطأ غير متوقع أثناء تجهيز التفاصيل. لم تُفقد بيانات الطلب ويمكنك المحاولة مجددًا.
        </Alert>
        <Button type="button" variant="outline" className="mt-4" onClick={this.retry}>
          إعادة المحاولة
        </Button>
      </div>
    );
  }
}
