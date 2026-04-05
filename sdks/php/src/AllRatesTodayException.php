<?php

namespace AllRatesToday;

class AllRatesTodayException extends \Exception
{
    private ?int $statusCode;

    public function __construct(string $message, ?int $statusCode = null)
    {
        parent::__construct($message);
        $this->statusCode = $statusCode;
    }

    public function getStatusCode(): ?int
    {
        return $this->statusCode;
    }
}
